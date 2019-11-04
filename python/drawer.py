from PIL import Image, ImageDraw, ImageFont

STREET_COLOR="#111111"
BUILDING_COLOR="#575757"
GRID_COLOR="#707070"

GRID_LINE_WIDTH=1

# Draw a street square onto the image at the given x,y position
def draw_street(image, ul):
    import card
    (X_size, Y_size) = card.SQUARE_SIZE

    draw = ImageDraw.Draw(image)
    
    (ulx, uly) = ul
    (brx, bry) = (ulx + X_size, uly + Y_size)
    br = (brx, bry)

    draw.rectangle([ul, br], fill=STREET_COLOR)

    del draw

# Draw a building square onto the image at the given x,y position
def draw_building(image, ul):
    import card
    (X_size, Y_size) = card.SQUARE_SIZE

    draw = ImageDraw.Draw(image)
    
    (ulx, uly) = ul
    (brx, bry) = (ulx + X_size, uly + Y_size)
    br = (brx, bry)

    draw.rectangle([ul, br], fill=BUILDING_COLOR)

    del draw

# Draw a door onto the image at the given x,y position facing the direction
def draw_door(image, ul, direction):
    print "drawing door - %s" % direction

    pass

# Draw the grid onto the card
def draw_grid(image):
    import card
    (X_size, Y_size) = card.SQUARE_SIZE

    for row in range(card.BUILDING_ROWS):
        for col in range(card.BUILDING_COLS):
            start = (X_size * col, Y_size * row)

            (start_x, start_y) = start

            end_horizontal = (X_size * card.BUILDING_COLS, start_y)
            end_vertical = (start_x, Y_size * card.BUILDING_ROWS)
            
            draw = ImageDraw.Draw(image)

            draw.line([start,end_horizontal], GRID_COLOR, GRID_LINE_WIDTH)
            draw.line([start,end_vertical], GRID_COLOR, GRID_LINE_WIDTH)

            del draw

# Thank you - https://mail.python.org/pipermail/image-sig/2009-May/005681.html
def draw_text(image, text, size, grid_loc, border=1):
    import card

    fillcolor = "white"
    shadowcolor = "black"

    draw = ImageDraw.Draw(image)

    font = "fonts/skylight.ttf"
    font = ImageFont.truetype(font, size)

    (y, x) = grid_loc
    (X_size, Y_size) = card.SQUARE_SIZE

    x = x * X_size
    y = y * Y_size
    
    int_border = 1
    while (int_border <= border):
        # thin border
        draw.text((x-int_border, y), text, font=font, fill=shadowcolor)
        draw.text((x+int_border, y), text, font=font, fill=shadowcolor)
        draw.text((x, y-int_border), text, font=font, fill=shadowcolor)
        draw.text((x, y+int_border), text, font=font, fill=shadowcolor)

        # thicker border
        draw.text((x-int_border, y-int_border), text, font=font, fill=shadowcolor)
        draw.text((x+int_border, y-int_border), text, font=font, fill=shadowcolor)
        draw.text((x-int_border, y+int_border), text, font=font, fill=shadowcolor)
        draw.text((x+int_border, y+int_border), text, font=font, fill=shadowcolor)

        int_border = int_border + 1;

    # now draw the text over it
    draw.text((x, y), text, font=font, fill=fillcolor)

    del draw

def get_text_size(text, size, border):
    font = "fonts/skylight.ttf"
    font = ImageFont.truetype(font, size)
    
    calc_size = font.getsize(text)

    print "Width of '%s' is '%s'" % (text, calc_size[1] + (2 * border)) 

    return calc_size[1] + (2 * border)

def draw_chip(image, tile_image_path, size, grid_loc):
    import card

    print "Drawing %s @ ('%s', '%s')" % (tile_image_path, grid_loc[0], grid_loc[1])

    (y, x) = grid_loc
    (X_size, Y_size) = card.SQUARE_SIZE

    x = int(x * X_size)
    y = int(y * Y_size)

    tile_image = Image.open(tile_image_path)
    tile_image.thumbnail((size, size), Image.BICUBIC)

    image.paste(tile_image, (x, y))

    del tile_image
    
