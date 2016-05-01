import picamera
from time import sleep

def start_cam():
	camera = picamera.PiCamera()
	#faceCascade = cv2.CascadeClassifier('faces.xml')
	camera.rotation = 90
	return camera

def get_face(camera):
	camera.capture('im.jpg', resize=(640,480))
	print 'saved im!'
	#image = cv2.imread('im.jpg')
        f = open('im.jpg', 'r+')
        image = f.read()
        img_str = image.encode('base64')

        #print 'image string is!' + str_img
        
	#gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
	#faces = faceCascade.detectMultiScale(
	#    gray,
	#    scaleFactor = 1.15,
	#    minNeighbors = 5,
	#    minSize = (30, 30),
	#    flags = cv2.cv.CV_HAAR_SCALE_IMAGE
	#  )
        f.close()
	return img_str
