// -*- mode: c++; c-basic-offset: 2; indent-tabs-mode: nil; -*-
// Copyright (C) 2015 Henner Zeller <h.zeller@acm.org>
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation version 2.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://gnu.org/licenses/gpl-2.0.txt>

// To use this image viewer, first get image-magick development files
// $ sudo aptitude install libmagick++-dev
//
// Then compile with
// $ make led-image-viewer

#include "led-matrix.h"
#include "threaded-canvas-manipulator.h"
#include "transformer.h"
#include "graphics.h"

#include <math.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <assert.h>
#include <getopt.h>
#include <limits.h>
#include <algorithm>

#include <vector>
#include <Magick++.h>
#include <magick/image.h>


using rgb_matrix::GPIO;
using rgb_matrix::Canvas;
using rgb_matrix::FrameCanvas;
using rgb_matrix::RGBMatrix;
using rgb_matrix::CanvasTransformer;

using namespace rgb_matrix;
volatile bool interrupt_received = false;
static void InterruptHandler(int signo) {
  interrupt_received = true;
}

class ImageScroller : public ThreadedCanvasManipulator {
public:
  // Scroll image with "scroll_jumps" pixels every "scroll_ms" milliseconds.
  // If "scroll_ms" is negative, don't do any scrolling.
  ImageScroller(RGBMatrix *m, int scroll_jumps, int scroll_ms = 30)
    : ThreadedCanvasManipulator(m), scroll_jumps_(scroll_jumps),
      scroll_ms_(scroll_ms),
      horizontal_position_(0),
      matrix_(m) {
      offscreen_ = matrix_->CreateFrameCanvas();
  }

  virtual ~ImageScroller() {
    Stop();
    WaitStopped();   // only now it is safe to delete our instance variables.
  }

  // _very_ simplified. Can only read binary P6 PPM. Expects newlines in headers
  // Not really robust. Use at your own risk :)
  // This allows reload of an image while things are running, e.g. you can
  // life-update the content.
  bool LoadPPM(const char *filename) {
    FILE *f = fopen(filename, "r");
    // check if file exists
    if (f == NULL && access(filename, F_OK) == -1) {
      fprintf(stderr, "File \"%s\" doesn't exist\n", filename);
      return false;
    }
    if (f == NULL) return false;
    char header_buf[256];
    const char *line = ReadLine(f, header_buf, sizeof(header_buf));
#define EXIT_WITH_MSG(m) { fprintf(stderr, "%s: %s |%s", filename, m, line); \
      fclose(f); return false; }
    if (sscanf(line, "P6 ") == EOF)
      EXIT_WITH_MSG("Can only handle P6 as PPM type.");
    line = ReadLine(f, header_buf, sizeof(header_buf));
    int new_width, new_height;
    if (!line || sscanf(line, "%d %d ", &new_width, &new_height) != 2)
      EXIT_WITH_MSG("Width/height expected");
    int value;
    line = ReadLine(f, header_buf, sizeof(header_buf));
    if (!line || sscanf(line, "%d ", &value) != 1 || value != 255)
      EXIT_WITH_MSG("Only 255 for maxval allowed.");
    const size_t pixel_count = new_width * new_height;
    Pixel *new_image = new Pixel [ pixel_count ];
    assert(sizeof(Pixel) == 3);   // we make that assumption.
    if (fread(new_image, sizeof(Pixel), pixel_count, f) != pixel_count) {
      line = "";
      EXIT_WITH_MSG("Not enough pixels read.");
    }
#undef EXIT_WITH_MSG
    fclose(f);
    fprintf(stderr, "Read image '%s' with %dx%d\n", filename,
            new_width, new_height);
    horizontal_position_ = 0;
    MutexLock l(&mutex_new_image_);
    new_image_.Delete();  // in case we reload faster than is picked up
    new_image_.image = new_image;
    new_image_.width = new_width;
    new_image_.height = new_height;
    return true;
  }

  void Run() {
    const int screen_height = matrix_->transformer()->Transform(offscreen_)->height();
    const int screen_width = matrix_->transformer()->Transform(offscreen_)->width();
    while (running()) {
      {
        MutexLock l(&mutex_new_image_);
        if (new_image_.IsValid()) {
          current_image_.Delete();
          current_image_ = new_image_;
          new_image_.Reset();
        }
      }
      if (!current_image_.IsValid()) {
        usleep(100 * 1000);
        continue;
      }
      for (int x = 0; x < screen_width; ++x) {
        for (int y = 0; y < screen_height; ++y) {
          const Pixel &p = current_image_.getPixel(
                     (horizontal_position_ + x) % current_image_.width, y);
          matrix_->transformer()->Transform(offscreen_)->SetPixel(x, y, p.red, p.green, p.blue);
        }
      }
      offscreen_ = matrix_->SwapOnVSync(offscreen_);
      horizontal_position_ += scroll_jumps_;
      if (horizontal_position_ < 0) horizontal_position_ = current_image_.width;
      if (scroll_ms_ <= 0) {
        // No scrolling. We don't need the image anymore.
        current_image_.Delete();
      } else {
        usleep(scroll_ms_ * 1000);
      }
    }
  }

private:
  struct Pixel {
    Pixel() : red(0), green(0), blue(0){}
    uint8_t red;
    uint8_t green;
    uint8_t blue;
  };

  struct Image {
    Image() : width(-1), height(-1), image(NULL) {}
    ~Image() { Delete(); }
    void Delete() { delete [] image; Reset(); }
    void Reset() { image = NULL; width = -1; height = -1; }
    inline bool IsValid() { return image && height > 0 && width > 0; }
    const Pixel &getPixel(int x, int y) {
      static Pixel black;
      if (x < 0 || x >= width || y < 0 || y >= height) return black;
      return image[x + width * y];
    }

    int width;
    int height;
    Pixel *image;
  };

  // Read line, skip comments.
  char *ReadLine(FILE *f, char *buffer, size_t len) {
    char *result;
    do {
      result = fgets(buffer, len, f);
    } while (result != NULL && result[0] == '#');
    return result;
  }

  const int scroll_jumps_;
  const int scroll_ms_;

  // Current image is only manipulated in our thread.
  Image current_image_;

  // New image can be loaded from another thread, then taken over in main thread.
  Mutex mutex_new_image_;
  Image new_image_;

  int32_t horizontal_position_;

  RGBMatrix* matrix_;
  FrameCanvas* offscreen_;
};

namespace {
// Preprocess as much as possible, so that we can just exchange full frames
// on VSync.
class PreprocessedFrame {
public:
  PreprocessedFrame(const Magick::Image &img,
                    CanvasTransformer *transformer,
                    rgb_matrix::FrameCanvas *output)
    : canvas_(output) {
    int delay_time = img.animationDelay();  // in 1/100s of a second.
    if (delay_time < 1) delay_time = 1;
    delay_micros_ = delay_time * 10000;

    Canvas *const transformed_draw_canvas = transformer->Transform(output);
    for (size_t y = 0; y < img.rows(); ++y) {
      for (size_t x = 0; x < img.columns(); ++x) {
        const Magick::Color &c = img.pixelColor(x, y);
        if (c.alphaQuantum() < 256) {
          transformed_draw_canvas
            ->SetPixel(x, y,
                       ScaleQuantumToChar(c.redQuantum()),
                       ScaleQuantumToChar(c.greenQuantum()),
                       ScaleQuantumToChar(c.blueQuantum()));
        }
      }
    }
  }

  FrameCanvas *canvas() const { return canvas_; }

  int delay_micros() const {
    return delay_micros_;
  }

private:
  FrameCanvas *const canvas_;
  int delay_micros_;
};
}  // end anonymous namespace

// Load still image or animation.
// Scale, so that it fits in "width" and "height" and store in "image_sequence".
// If this is a still image, "image_sequence" will contain one image, otherwise
// all animation frames.
static bool LoadAnimation(const char *filename, int width, int height,
                          std::vector<Magick::Image> *image_sequence) {
  std::vector<Magick::Image> frames;
  const char * temp = "test2.ppm";
  const char * png_temp = "test2.png";
  fprintf(stderr, "Read image...\n");
  readImages(&frames, png_temp);
  if (frames.size() == 0) {
    fprintf(stderr, "No image found.");
    return false;
  }

  // Put together the animation from single frames. GIFs can have nasty
  // disposal modes, but they are handled nicely by coalesceImages()
  if (frames.size() > 1) {
    fprintf(stderr, "Assembling animation with %d frames.\n",
            (int)frames.size());
    Magick::coalesceImages(image_sequence, frames.begin(), frames.end());
  } else {
    image_sequence->push_back(frames[0]);   // just a single still image.
  }
  bool textFound = false;
  if ((*image_sequence)[0].columns() > 32) {
     fprintf(stderr, "Text found\n");
     
	readImages(&frames, temp);
     textFound = true;
  if (frames.size() == 0) {
    fprintf(stderr, "No image found.");
    return false;
  }

  // Put together the animation from single frames. GIFs can have nasty
  // disposal modes, but they are handled nicely by coalesceImages()
  if (frames.size() > 1) {
    fprintf(stderr, "Assembling animation with %d frames.\n",
            (int)frames.size());
    Magick::coalesceImages(image_sequence, frames.begin(), frames.end());
  } else {
    image_sequence->push_back(frames[0]);   // just a single still image.
  }

  }

  fprintf(stderr, "Scale ... %dx%d -> %dx%d\n",
          (int)(*image_sequence)[0].columns(), (int)(*image_sequence)[0].rows(),
          width, height);
  for (size_t i = 0; i < image_sequence->size(); ++i) {
    (*image_sequence)[i].scale(Magick::Geometry(width, height));
  }
  if (textFound) {
	return false;
	} else {
  	return true;
	}
}

// Preprocess buffers: create readily filled frame-buffers that can be
// swapped with the matrix to minimize computation time when we're displaying.
static void PrepareBuffers(const std::vector<Magick::Image> &images,
                           RGBMatrix *matrix,
                           std::vector<PreprocessedFrame*> *frames) {
  fprintf(stderr, "Preprocess for display.\n");
  CanvasTransformer *const transformer = matrix->transformer();
  for (size_t i = 0; i < images.size(); ++i) {
    FrameCanvas *canvas = matrix->CreateFrameCanvas();
    frames->push_back(new PreprocessedFrame(images[i], transformer, canvas));
  }
}

static void DisplayAnimation(const std::vector<PreprocessedFrame*> &frames,
                             RGBMatrix *matrix) {
  signal(SIGTERM, InterruptHandler);
  signal(SIGINT, InterruptHandler);
  fprintf(stderr, "Display.\n");
  for (unsigned int i = 0; i < 10; ++i) {
    fprintf(stderr,"iteration\n");
    const PreprocessedFrame *frame = frames[i % frames.size()];
    matrix->SwapOnVSync(frame->canvas());
    if (frames.size() == 1) {
      sleep(1);  // Only one image. Nothing to do.
    } else {
      usleep(frame->delay_micros());
    }
  }
}

static int usage(const char *progname) {
  fprintf(stderr, "usage: %s [options] <image>\n", progname);
  fprintf(stderr, "Options:\n"
          "\t-r <rows>     : Panel rows. '16' for 16x32 (1:8 multiplexing),\n"
	  "\t                '32' for 32x32 (1:16), '8' for 1:4 multiplexing; "
          "Default: 32\n"
          "\t-P <parallel> : For Plus-models or RPi2: parallel chains. 1..3. "
          "Default: 1\n"
          "\t-c <chained>  : Daisy-chained boards. Default: 1.\n"
          "\t-L            : Large 64x64 display made from four 32x32 in a chain\n"
          "\t-d            : Run as daemon.\n"
          "\t-b <brightnes>: Sets brightness percent. Default: 100.\n");
  return 1;
}

int main(int argc, char *argv[]) {
  Magick::InitializeMagick(*argv);

  int rows = 32;
  int chain = 1;
  int parallel = 1;
  int pwm_bits = -1;
  int brightness = 100;
  bool large_display = false;  // example for using Transformers
  bool as_daemon = false;

  int opt;
  while ((opt = getopt(argc, argv, "r:P:c:p:b:dL")) != -1) {
    switch (opt) {
    case 'r': rows = atoi(optarg); break;
    case 'P': parallel = atoi(optarg); break;
    case 'c': chain = atoi(optarg); break;
    case 'p': pwm_bits = atoi(optarg); break;
    case 'd': as_daemon = true; break;
    case 'b': brightness = atoi(optarg); break;
    case 'L':
      chain = 4;
      rows = 32;
      large_display = true;
      break;
    default:
      return usage(argv[0]);
    }
  }

  if (rows != 8 && rows != 16 && rows != 32) {
    fprintf(stderr, "Rows can one of 8, 16 or 32 "
            "for 1:4, 1:8 and 1:16 multiplexing respectively.\n");
    return 1;
  }

  if (chain < 1) {
    fprintf(stderr, "Chain outside usable range\n");
    return usage(argv[0]);
  }
  if (chain > 8) {
    fprintf(stderr, "That is a long chain. Expect some flicker.\n");
  }
  if (parallel < 1 || parallel > 3) {
    fprintf(stderr, "Parallel outside usable range.\n");
    return usage(argv[0]);
  }

  if (brightness < 1 || brightness > 100) {
    fprintf(stderr, "Brightness is outside usable range.\n");
    return usage(argv[0]);
  }

  if (optind >= argc) {
    fprintf(stderr, "Expected image filename.\n");
    return usage(argv[0]);
  }

  const char *filename = argv[optind];

  /*
   * Set up GPIO pins. This fails when not running as root.
   */
  GPIO io;
  if (!io.Init())
    return 1;

  // Start daemon before we start any threads.
  if (as_daemon) {
    if (fork() != 0)
      return 0;
    close(STDIN_FILENO);
    close(STDOUT_FILENO);
    close(STDERR_FILENO);
  }

  RGBMatrix *const matrix = new RGBMatrix(&io, rows, chain, parallel);
  if (pwm_bits >= 0 && !matrix->SetPWMBits(pwm_bits)) {
    fprintf(stderr, "Invalid range of pwm-bits\n");
    return 1;
  }

  matrix->SetBrightness(brightness);

  // Here is an example where to add your own transformer. In this case, we
  // just to the chain-of-four-32x32 => 64x64 transformer, but just use any
  // of the transformers in transformer.h or write your own.
  if (large_display) {
    // Mapping the coordinates of a 32x128 display mapped to a square of 64x64
    matrix->SetTransformer(new rgb_matrix::LargeSquare64x64Transformer());
  }
  ThreadedCanvasManipulator *image_gen = NULL;
  const char * temp = "test2.ppm";
  const char * png_temp = "test2.png";
  while (!interrupt_received) {
	  std::vector<Magick::Image> sequence_pics;
	  if (!LoadAnimation(png_temp, matrix->width(), matrix->height(),
	                     &sequence_pics)) {
	    ImageScroller *scroller = new ImageScroller(matrix,1,30);
            
	    if (!scroller->LoadPPM(temp))
		return 1;
	    image_gen = scroller;
            image_gen->Start();
            sleep(5);
            delete image_gen;
	  } else {
	
	  std::vector<PreprocessedFrame*> frames;
	  PrepareBuffers(sequence_pics, matrix, &frames);
	
	  DisplayAnimation(frames, matrix);
	
	  fprintf(stderr, "Iteration done");
	
	  // Animation finished. Shut down the RGB matrix.
	  matrix->Clear();
	  }
  }	
        delete matrix;
  	return 0;
  
}
