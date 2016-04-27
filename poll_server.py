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

CENSUS_API_KEY = ""

STATE_TO_CODE = {'Mississippi': '28', 'Northern Mariana Islands': '69', 'U.S. Virgin Islands': '78', 'Oklahoma': '40', 'Delaware': '10', 'Minnesota': '27', 'Illinois': '17', 'Arkansas': '05', 'New Mexico': '35', 'Indiana': '18', 'Maryland': '24', 'Louisiana': '22', 'Idaho': '16', 'Wyoming': '56', 'Tennessee': '47', 'Arizona': '04', 'Iowa': '19', 'STATE_NAME': 'STATE', 'Michigan': '26', 'Kansas': '20', 'Utah': '49', 'Virginia': '51', 'Oregon': '41', 'Connecticut': '09', 'Montana': '30', 'California': '06', 'Massachusetts': '25', 'West Virginia': '54', 'South Carolina': '45', 'New Hampshire': '33', 'Wisconsin': '55', 'Vermont': '50', 'Georgia': '13', 'North Dakota': '38', 'Pennsylvania': '42', 'Puerto Rico': '72', 'Florida': '12', 'Alaska': '02', 'Kentucky': '21', 'Hawaii': '15', 'Nebraska': '31', 'Missouri': '29', 'Ohio': '39', 'Alabama': '01', 'New York': '36', 'American Samoa': '60', 'South Dakota': '46', 'Colorado': '08', 'New Jersey': '34', 'Guam': '66', 'Washington': '53', 'U.S. Minor Outlying Islands': '74', 'North Carolina': '37', 'District of Columbia': '11', 'Texas': '48', 'Nevada': '32', 'Maine': '23', 'Rhode Island': '44'}

def get_population():
    # Find IP Info
    response = urllib.urlopen('http://ipinfodb.com/index.php').read()
    zip_str = "Zip or postal code : "
    state_str = "State/Province : "
    zip_idx = response.find(zip_str)
    state_idx = response.find(state_str)
    zip_code = int(response[zip_idx + len(zip_str): zip_idx + 5 + len(zip_str)])
    state = response[state_idx + len(state_str):]
    state = state[:state.find("<")]

    # Find population info
    response = ""
    while(response == ""):
        print "trying again"
        census_url = "http://api.census.gov/data/2010/sf1?key="+CENSUS_API_KEY+"0&get=P0010001&for=zip+code+tabulation+area:"+str(zip_code)+"&in=state:" + state_to_code[state]
        print census_url
        r = requests.get(census_url)
        response = r.json()[1][0]
        print response
        zip_code += 1
    return int(response)

def make_requests(population): 
    # Sends population data to server, and gets current add message
    url = "https://adshirtise.herokuapp.com/api/advertisers/wzNj4sQeNfB2rWug7/population"
    r = requests.put(url, data = {'population':population})
    url = "https://adshirtise.herokuapp.com/api/advertisers/wzNj4sQeNfB2rWug7"
    r = requests.get(url)
    return r.json()['data']['curr_msg']

def make_text_img(text):
    # Makes ppm from given text
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
     
    im.save("test.ppm")

def send_text(bid, rate):
    # Use sms gateway provided by mobile carrier:
    # at&t:     number@mms.att.net
    # t-mobile: number@tmomail.net
    # verizon:  number@vtext.com
    # sprint:   number@page.nextel.com

    fromaddr = "radar.alert.cm@gmail.com"
    toaddr = "5103663458@vtext.com"

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(fromaddr, "sechromojuluming")

    text = "Today you made $" + str(bid*rate) + "!"
    server.sendmail(fromaddr, toaddr, text)
    server.quit()

#os.system("./led-matrix 1 test.ppm")

interval = 0
while true:
    if interval == 0:
        interval = 100000
        population = get_population()
        ad = make_requests(population)
        make_text_img(ad)
    interval -= 1
