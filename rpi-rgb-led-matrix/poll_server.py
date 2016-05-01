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
#import cam

STATE_TO_CODE = {'Mississippi': '28', 'Northern Mariana Islands': '69', 'U.S. Virgin Islands': '78', 'Oklahoma': '40', 'Delaware': '10', 'Minnesota': '27', 'Illinois': '17', 'Arkansas': '05', 'New Mexico': '35', 'Indiana': '18', 'Maryland': '24', 'Louisiana': '22', 'Idaho': '16', 'Wyoming': '56', 'Tennessee': '47', 'Arizona': '04', 'Iowa': '19', 'STATE_NAME': 'STATE', 'Michigan': '26', 'Kansas': '20', 'Utah': '49', 'Virginia': '51', 'Oregon': '41', 'Connecticut': '09', 'Montana': '30', 'California': '06', 'Massachusetts': '25', 'West Virginia': '54', 'South Carolina': '45', 'New Hampshire': '33', 'Wisconsin': '55', 'Vermont': '50', 'Georgia': '13', 'North Dakota': '38', 'Pennsylvania': '42', 'Puerto Rico': '72', 'Florida': '12', 'Alaska': '02', 'Kentucky': '21', 'Hawaii': '15', 'Nebraska': '31', 'Missouri': '29', 'Ohio': '39', 'Alabama': '01', 'New York': '36', 'American Samoa': '60', 'South Dakota': '46', 'Colorado': '08', 'New Jersey': '34', 'Guam': '66', 'Washington': '53', 'U.S. Minor Outlying Islands': '74', 'North Carolina': '37', 'District of Columbia': '11', 'Texas': '48', 'Nevada': '32', 'Maine': '23', 'Rhode Island': '44'}

#camera = cam.start_cam()

def get_population():
    # Find IP Info
    response = urllib.urlopen('http://ipinfodb.com/index.php').read()
    zip_str = "Zip or postal code : "
    state_str = "State/Province : "
    zip_idx = response.find(zip_str)
    state_idx = response.find(state_str)
    zip_code = int((response[zip_idx + len(zip_str): zip_idx + 5 + len(zip_str)]))
    state = response[state_idx + len(state_str):]
    state = state[:state.find("<")]
    print ("Found zipcode: " + str(zip_code))
    # Find population info
    response_code = 204
    print ("Finding population")
    #return 1000
    resp = ''
    while(response_code != 200):
        census_url = "http://api.census.gov/data/2010/sf1?key=4e9dd1e9a1db5b4a932ebf8b25e2fb8d18e23cc0&get=P0010001&for=zip+code+tabulation+area:"+str(zip_code)+"&in=state:" + STATE_TO_CODE[state]
        r = requests.get(census_url)
	print r
	response_code = r.status_code
	if response_code == 200:
            resp = r.json()[1][0]
            print resp
        zip_code += 1
    return int(resp)

def make_requests(population, num_face):
    url = "https://adshirtise.herokuapp.com/api/advertisers/wzNj4sQeNfB2rWug7/population"
    r = requests.put(url, data = {'population':population, 'image': im})
    url = "https://adshirtise.herokuapp.com/api/advertisers/wzNj4sQeNfB2rWug7"
    r = requests.get(url)
    return r.json()['data']['curr_msg']


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
    im.save('test2.png')
    im.save('test2.ppm')

#os.system("./led-matrix 1 test.ppm"
def make_image(im):
    f = open('temp_img.jpg', 'w')
    f.write(im.decode('base64'))
    f.close()
    matrix_im = Image.open('temp_img.jpg')
    #print matrix_im.size
    matrix_im = matrix_im.crop((4, 4, 260, 260))
    #print matrix_im.size
    matrix_im = matrix_im.resize((32,32))
    matrix_im.save('test2.png')
    
def make_ad_image(ad):
    if ad[0:4] == '/9j/': 
        make_image(ad)
    else:
        make_text_img(ad)

current_ad = ''  
interval = 0
while True:
    if interval == 0:
        interval = 10 
        population = (get_population())
        print("Found population of " + str(population))
	#im = cam.get_face(camera)
        im= ''
        print("Updating population and getting current ad") 
        current_ad = make_requests(population, im)
        make_ad_image(current_ad)
        #print("Current ad: " + current_ad) 

    a = 'make_text_img(current_ad)'
    
    interval -= 1
    #os.system("sudo ./led-matrix -D 1 test.ppm")

