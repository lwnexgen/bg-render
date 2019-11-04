STREET_SYMBOL="*"
BUILDING_SYMBOL="B"
DOOR_SYMBOLS="UDLR/|-`"

import card
from drawer import draw_street, draw_building, draw_door

def SquareFactory(position, symbol):
    if symbol == STREET_SYMBOL:
        return StreetSquare(position, symbol)

    if symbol == BUILDING_SYMBOL:
        return BuildingSquare(position, symbol)

    if symbol in DOOR_SYMBOLS:
        return DoorSquare(position, symbol)

    raise LayoutFormatError(symbol)

class Square:
    def __init__(self, position_tuple, symbol):
        (self.row, self.col) = position_tuple
        (X_size, Y_size) = card.SQUARE_SIZE
        self.symbol = symbol
        self.pixel_position = (self.col * Y_size, self.row * X_size)
        
    def __repr__(self):
        return "%s - (%s,%s)" % (self.__class__.__name__, self.row, self.col)
    
    def __str__(self):
        return "[%s]" % self.symbol

class BuildingSquare(Square):
    def render(self, image):
        draw_building(image, self.pixel_position)

class StreetSquare(Square):
    def render(self, image):
        draw_street(image, self.pixel_position)

class DoorSquare(BuildingSquare):
    def render(self, image):
        draw_building(image, self.pixel_position)
    
        if self.symbol in "UDRL":
            draw_door(image, self.pixel_position, self.symbol)
        elif self.symbol == '/':
            draw_door(image, self.pixel_position, "L")
            draw_door(image, self.pixel_position, "D")
        elif self.symbol == '|':
            draw_door(image, self.pixel_position, "U")
            draw_door(image, self.pixel_position, "D")
        elif self.symbol == '`':
            draw_door(image, self.pixel_position, "R")
            draw_door(image, self.pixel_position, "D")
        elif self.symbol == '-':
            draw_door(image, self.pixel_position, "L")
            draw_door(image, self.pixel_position, "R")

class LayoutFormatError(Exception):
    """
    Raised when a symbol found in the layout table is not known

    Attributes:
    symbol -- symbol that is not known
    """

    def __init__(self, symbol):
        self.symbol = symbol

    def __str__(self):
        return repr(self.symbol)
