const PIXEL_SIZE = 8;
const NCOLS = 64;
const NROWS = 64;

function paint_screen(ctx, population)
{
    let raw_img = ctx.getImageData(0, 0, NCOLS * PIXEL_SIZE, NROWS * PIXEL_SIZE);
    let raw_data = raw_img.data;
    for (let i = 0; i < NROWS; i++) {
        for (let j = 0; j < NCOLS; j++) {
            let color = [
                255 * (1 - population[i][j]),
                255 * (1 - population[i][j]),
                255 * (1 - population[i][j])
            ]
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

function init_buttons(game_state)
{
    let pause_resume_btn = document.getElementById("pause-resume-button");
    let step_btn = document.getElementById("step-button");

    pause_resume_btn.onclick = function() {
        game_state.running = !game_state.running;

        // Only enable the "step" button if the simulation is not running
        step_btn.disabled = game_state.running;
    }
    step_btn.disabled = game_state.running;

    step_btn.onclick = function() {
        step(game_state);
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
        paint_screen(ctx, game_state.population);

        gameloop(ctx, game_state);
    }, 100);
}

window.onload = function()
{
    let screen = document.getElementById("screen");
    screen.width = NCOLS * PIXEL_SIZE;
    screen.height = NROWS * PIXEL_SIZE;
    let ctx = screen.getContext("2d");

    let game_state = {
        running: true,
        population: create_array(NROWS, NCOLS),
        old_population: create_array(NROWS, NCOLS),
    }

    init_buttons(game_state);

    paint_screen(ctx, game_state.population);
    gameloop(ctx, game_state);
}
