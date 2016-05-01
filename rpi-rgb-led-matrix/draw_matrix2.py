import subprocess
import time
from rgbmatrix import RGBMatrix
import signal

myMatrix = RGBMatrix(32,2,1)

#while True:
print 'hi'
p = subprocess.Popen('./led-image-viewer test2.jpg', shell=True)
#p.wait()
i = 0
while i < 5:
    time.sleep(1)
    i+=1
p.send_signal(signal.SIGTERM)
    
print 'entered python'

#p.terminate()
#myMatrix.Fill(0,0,0)
#time.sleep(5)
#myMatrix.Clear()
#time.sleep(.5)
#call(['./led-image-viewer', 'test2.jpg'])
