const PIXEL_SIZE = 8;
const NCOLS = 64;
const NROWS = 64;

const PALETTE_DB = {
    "Black and white": [
        [255, 255, 255],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ],
    "Ice Cream": [
        [0, 48, 59],
        [255, 119, 119],
        [255, 206, 150],
        [241, 242, 218]
    ],
    "Nostalgia": [
        [64, 80, 16],
        [208, 208, 88],
        [160, 168, 64],
        [112, 128, 40]
    ],
    "Horehound-4": [
        [60, 20, 2],
        [202, 154, 87],
        [233, 111, 27],
        [49, 43, 36]
    ],
    "CMYK": [
        [0, 0, 0],
        [0, 255, 255],
        [255, 0, 255],
        [255, 255, 0]
    ]
};

function get_pixel_color(population, i, j, color_palette_name)
{
    let palette = PALETTE_DB[color_palette_name];
    if (population[i][j] == 0) {
        return palette[0];
    }

    let n_neigs = count_neigs(population, i, j);
    if (n_neigs <= 2) {
        return palette[1];
    } else if (n_neigs <= 4) {
        return palette[2];
    } else {
        return palette[3];
    }
}

function paint_screen(ctx, population, color_palette_name)
{
    let raw_img = ctx.getImageData(0, 0, NCOLS * PIXEL_SIZE, NROWS * PIXEL_SIZE);
    let raw_data = raw_img.data;
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            let color = get_pixel_color(population, i, j, color_palette_name);
            for (let pi = 0; pi < PIXEL_SIZE; pi++) {
                let ii = i * PIXEL_SIZE + pi;
                for (let pj = 0; pj < PIXEL_SIZE; pj++) {
                    let jj = j * PIXEL_SIZE + pj;
                    let index = (ii * (NCOLS * PIXEL_SIZE) + jj) * 4;
                    raw_data[index + 0] = color[0];
                    raw_data[index + 1] = color[1];
                    raw_data[index + 2] = color[2];
                    raw_data[index + 3] = 255;
                }
            }
        }
    }
    ctx.putImageData(raw_img, 0, 0);
}

function create_array(n, m)
{
    let arr = new Array(n);
    for (let i = 0; i < n; i++) {
        arr[i] = new Array(m);
        for (let j = 0; j < m; j++) {
            arr[i][j] = 0;
        }
    }

    // Random population initialization
    // Perhaps should be extracted to somewhere else
    for (let i = 0; i < n; i++) {
        arr[i] = new Array(m);
        for (let j = 0; j < m; j++) {
            arr[i][j] = (Math.random() > 0.8);
        }
    }

    return arr;
}

function clear_population(population)
{
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            population[i][j] = 0;
        }
    }
}

function copy_array_data(from, to)
{
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            to[i][j] = from[i][j];
        }
    }
}

function count_neigs(population, i, j)
{
    let count = 0;
    for (let ii = -1; ii <= 1; ii++) {
        for (let jj = -1; jj <= 1; jj++) {
            if (ii == 0 && jj == 0) continue;
            if (i + ii < 0 || i + ii >= NROWS) continue;
            if (j + jj < 0 || j + jj >= NCOLS) continue;

            count += population[i + ii][j + jj];
        }
    }
    return count;
}

function run_step(new_population, old_population)
{
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            let n_neighbors = count_neigs(old_population, i, j);
            if (old_population[i][j]) {
                new_population[i][j] = (n_neighbors == 2 || n_neighbors == 3);
            } else {
                new_population[i][j] = (n_neighbors == 3);
            }
        }
    }
}

function setup_buttons(game_state)
{
    let pause_resume_btn = document.getElementById("pause-resume-button");
    let step_btn = document.getElementById("step-button");
    let clear_btn = document.getElementById("clear-button");
    let palette_sel = document.getElementById("palette-selection");

    pause_resume_btn.onclick = function() {
        game_state.running = !game_state.running;

        // Only enable setup button if the game is not running
        step_btn.disabled = game_state.running;
    }
    step_btn.disabled = game_state.running;

    step_btn.onclick = function() {
        step(game_state);
    }    

    clear_btn.onclick = function() {
        clear_population(game_state.old_population);
        clear_population(game_state.population);
    }

    for (const key in PALETTE_DB) {
        let el = document.createElement("option");
        el.textContent = key;
        el.value = key;
        palette_sel.appendChild(el);
    }
    palette_sel.onchange = function(e) {
        game_state.color_palette_name = e.target.value;
    }
}

function step(game_state)
{
    run_step(game_state.population, game_state.old_population);
    copy_array_data(game_state.population, game_state.old_population);
}

function gameloop(ctx, game_state)
{
    setTimeout(function () {
        if (game_state.running) {
            step(game_state);
        }
        paint_screen(ctx, game_state.population, game_state.color_palette_name);

        gameloop(ctx, game_state);
    }, 100);
}

function setup_screen(screen, game_state)
{
    screen.width = NCOLS * PIXEL_SIZE;
    screen.height = NROWS * PIXEL_SIZE;

    to_game_coord = function(x) { return Math.floor(x / PIXEL_SIZE); };

    let is_drawing = false;
    let last_draw_position = [-1, -1];
    function do_draw_at(draw_position) {
        let [j, i] = draw_position;
        if (last_draw_position[0] != j || last_draw_position[1] != i) {
            let new_value = !game_state.population[i][j];
            game_state.population[i][j] = new_value;
            game_state.old_population[i][j] = new_value;
        }
        last_draw_position = [...draw_position];
    }
    screen.onmousedown = function(e) {
        is_drawing = true;
        let game_position = [to_game_coord(e.offsetX), to_game_coord(e.offsetY)];
        do_draw_at(game_position);
    }
    screen.onmouseup = function(e) {
        last_draw_position = [-1, -1];
        is_drawing = false;
    }
    screen.onmousemove = function(e) {
        if (!is_drawing) {
            return;
        }
        let game_position = [to_game_coord(e.offsetX), to_game_coord(e.offsetY)];
        do_draw_at(game_position);
    }
}

window.onload = function()
{
    let screen = document.getElementById("screen");
    let ctx = screen.getContext("2d");
    let game_state = {
        running: true,
        population: create_array(NROWS, NCOLS),
        old_population: create_array(NROWS, NCOLS),
        color_palette_name: Object.keys(PALETTE_DB)[0]
    }

    setup_screen(screen, game_state);
    setup_buttons(game_state);

    paint_screen(ctx, game_state.population, game_state.color_palette_name);
    gameloop(ctx, game_state);
}
