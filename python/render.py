#!/usr/bin/python
import json
import argparse
from card import Card

parser=argparse.ArgumentParser(description='Render the building from the given template')

parser.add_argument('template', help="Template file")
parser.add_argument('filename', help="Image file to write")

args = parser.parse_args();

try:
    file_data = open(args.template).read().replace('\n', '')
    card = Card(json.loads(file_data))
    card.render(args.filename)
except IOError:
    print "Make sure that the template file is actually a file"
except ValueError as e:
    print "{0} is malformed: {1}".format(args.template, e.message)
    exit(1)
    
