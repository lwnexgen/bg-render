import layout
from layout import SquareFactory, LayoutFormatError
from drawer import draw_grid, draw_text, draw_chip, get_text_size

from PIL import Image

BUILDING_ROWS = 5
BUILDING_COLS = 5

SQUARE_SIZE = (175.0,175.0)
TITLE_FONT_SIZE = int(.43 * SQUARE_SIZE[0])
BASE_FONT_SIZE = int(.24 * SQUARE_SIZE[0])

DPI=96.0

FORT_CHIP_IMAGE="chips/fort-chip.png"
ITEM_CHIP_IMAGE="chips/item-chip.png"
CHIP_SIZE = (40.0 / 150.0) * SQUARE_SIZE[0]

class Card:
    def __init__(self, json):
        self.name = json["name"]
        self.base = json["base"]
        self.fort = json["fort"]
        self.item = json["item"]
        self.skills = json["skills"]

        self.squares = self.read_layout(json["layout"])

        X_size, Y_size = int(SQUARE_SIZE[0]), int(SQUARE_SIZE[1])
        self.image = Image.new("RGB", (BUILDING_COLS * X_size, BUILDING_ROWS * Y_size))
            
        self.text_render()

    def read_layout(self, layout):
        # initialize a 2d array of empty chars of size 5x5
        structure = [['' for i in range(BUILDING_ROWS)] for j in range(BUILDING_COLS)]

        index = 0
        row = 0
        for c in layout:
            col = index % BUILDING_COLS
            if index > 0 and col == 0:
                row = row + 1

            try:
                structure[row][col] = SquareFactory((row, col), c)
            except LayoutFormatError as e:
                print "'%s' not defined" % e.symbol
                exit(1)

            index = index + 1

        return structure

    def render(self, filename):
        for row in range(BUILDING_ROWS):
            for col in range(BUILDING_COLS):
                self.squares[row][col].render(self.image)

        draw_grid(self.image)

        try:
            for row in range(BUILDING_ROWS):
                for col in range(BUILDING_COLS):
                    square = self.squares[row][col]
                    if isinstance(square, layout.BuildingSquare):
                        self.render_stats((row, col))
                        raise StopIteration
        except StopIteration:
            self.image.save(filename)
            return

    def render_title(self, grid_square):
        border_size = int((2.0/150) * SQUARE_SIZE[0])
        draw_text(self.image, self.name, TITLE_FONT_SIZE, grid_square, border_size)

    def render_base(self, grid_square):
        border_size = int((2.0/150) * SQUARE_SIZE[0])
        draw_text(self.image, "Base: %s" % (self.base), BASE_FONT_SIZE, grid_square, border_size)

    def render_stats(self, grid_square):
        title_position = (
            grid_square[0],
            grid_square[1] + .02
        )

        base_position = (
            title_position[0] + TITLE_FONT_SIZE / SQUARE_SIZE[0] - .07,
            title_position[1] + .1
        )
            
        skill_position = (
            base_position[0] + BASE_FONT_SIZE / SQUARE_SIZE[0],
            base_position[1] - .01
        )

        fort_item_position = (
            skill_position[0] + BASE_FONT_SIZE / SQUARE_SIZE[0] + .07,
            skill_position[1]
        )

        self.render_title(title_position)
        self.render_base(base_position)
        self.render_skill_chips(skill_position)
        self.render_fort_item_chips(fort_item_position)

    def render_fort_item_chips(self, grid_square):
        chip_y, chip_x = grid_square

        chip_space = (CHIP_SIZE / SQUARE_SIZE[0]) + .05
        
        for FORT in range(self.fort):
            draw_chip(self.image, FORT_CHIP_IMAGE, CHIP_SIZE, (chip_y, chip_x))
            chip_x = chip_x + chip_space

        for ITEM in range(self.item):
            draw_chip(self.image, ITEM_CHIP_IMAGE, CHIP_SIZE, (chip_y, chip_x))
            chip_x = chip_x + chip_space

    def render_skill_chips(self, grid_square):
        chip_y, chip_x = grid_square

        chip_space = (CHIP_SIZE / SQUARE_SIZE[0]) + .05

        for skill in self.skills:
            chip_path = "chips/%s.png" % skill

            draw_chip(self.image, chip_path, CHIP_SIZE, (chip_y, chip_x))
            chip_x = chip_x + chip_space

    def text_render(self):
        for row in range(BUILDING_ROWS):
            row_print = ""

            for col in range(BUILDING_COLS):
                row_print = "%s%s" % (row_print, self.squares[row][col])

            print row_print

    def __repr__(self):
        return self.name
    
    def __str__(self):
        return self.name

