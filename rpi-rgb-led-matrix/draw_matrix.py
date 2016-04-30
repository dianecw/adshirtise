import requests
import os
from PIL import ImageFont
from PIL import Image
from PIL import ImageDraw
import smtplib
import urllib
import re
import json
import ast
import time
from rgbmatrix import RGBMatrix
from subprocess import call
matrix = RGBMatrix(32,1)
def make_text_img(text):
    text = ((text, (255, 0, 0)),)
 
    font = ImageFont.truetype("/usr/share/fonts/truetype/freefont/FreeSans.ttf", 16)
    all_text = ""
    for text_color_pair in text:
        t = text_color_pair[0]
        all_text = all_text + t
     
    print(all_text)
    width, ignore = font.getsize(all_text)
    print(width)
     
    im = Image.new("RGB", (width + 30, 16), "black")
    draw = ImageDraw.Draw(im)
     
    x = 0;
    for text_color_pair in text:
        t = text_color_pair[0]
        c = text_color_pair[1]
        print("t=" + t + " " + str(c) + " " + str(x))
        draw.text((x, 0), t, c, font=font)
        x = x + font.getsize(t)[0]
    matrix.Clear()
    for n in range(32,-im.size[0],-1):
        matrix.SetImage(im.im.id, n, 0)
        time.sleep(0.05) 
#os.system("./led-matrix 1 test.ppm")

def make_image(im):
    f = open('temp_img.jpg', 'w')
    f.write(im.decode('base64'))
    f.close()
    matrix_im = Image.open('temp_img.jpg')
    #print matrix_im.size
    matrix_im = matrix_im.crop((4, 4, 260, 260))
    #print matrix_im.size
    matrix_im = matrix_im.resize((32,32))
    matrix_im.save('test2.jpg')
    matrix_im.load()
    matrix.Clear()
    #print(matrix_im.size)
    #for n in range(32, -matrix_im.size[0], -1):#
    matrix.SetImage(matrix_im.im.id,0,0)
    time.sleep(5)
    
    
#current_ad = ''  
#interval = 0
#while True:
    #if = open('ad.txt')
    #current_ad = f.read()
    #if current_ad[0:4] == '/9j/':
    #    print('its an image!')
    #    make_image(current_ad)
    #else:
    #    make_text_img(current_ad)
    #interval -= 1
call(['./minimal-example', '-D', '1', 'runtext.ppm'])
    #os.system("sudo ./led-matrix -D 1 runtext.ppm")
