import {Cell, cell_types} from "./cell.js";
import {direction, Player} from "./player.js";
import {generate_map, clear_map, check_tower_connectivity_and_fill_holes, generate_table} from "./map_creation.js";
import {game_handler, field_height, field_width, tps} from "./game_handler.js";
import {broadcast, styles} from "./server.mjs";

export function handle_player_loss() {
    // document.querySelector("#modal-text").innerText = "Вы проиграли, вы лох";
    // document.querySelector(".modal_window").classList.remove("hidden");
}

export function handle_player_win() {
    // document.querySelector("#modal-text").innerText = "Вы выиграли, но все равно вы лох";
    // document.querySelector(".modal_window").classList.remove("hidden");
}

function send_player_names(room) {
    for (let i = 0; i < room.players.length; i++) {
        if (!room.players[i].is_bot) {
            broadcast(room, {action: 'SET_NAME', name: room.players[i].name, i: i});
        }
    }
    // for (let i = 0; i < players.length; i++) {
    //     document.querySelector(`.player${i + 1}_captured .nick`).textContent = players[i].name;
    // }
}

export function send_captured(room, captured) {
    for (let i = 0; i < captured.length; i++) {
        broadcast(room, {action: "UPDATE_CAPTURED", value: captured[i], i:i});
    }
    // for (let i = 0; i < captured.length; i++) {
    //     document.querySelector(`.player${i + 1}_captured .score`).textContent = captured[i];
    // }
}

export function send_points(player) {
    player.socket.send(JSON.stringify({
        action: 'POINTS',
        points: player.points
    }));
}

export function start_game(room) {
    let players = room.players;
    room.status = 1;
    for(let i = players.length; i < 4; i++) {
        let [p, p_tower] = styles[i];
        let player1 = new Player(p, p_tower, i, room.id,`enemy_${i}`, 0, 0, direction.NONE, undefined, true);
        players.push(player1);
    }

    send_player_names(room);
    let tower_styles = new Set();
    let cell_styles = new Set();
    for (let player of players) {
        cell_styles.add(player.cell_style);
        tower_styles.add(player.tower_style);
    }
    let cells = room.map;
    do {
        clear_map(cells);
        generate_map(cells, players);
    }
    while (!check_tower_connectivity_and_fill_holes(cells, tower_styles));
    broadcast(room, {action: 'START_GAME'});
    let tick = 0;
    let game_handler_event = setInterval(() => {
        game_handler(room, tick, cell_styles, tower_styles);
        tick = (tick + 1);
    }, 1000 / tps);
    room.interval = game_handler_event;
}


// btn.onclick = function(e) {
//     modal.style.display = "block";
//     e.preventDefault();
// }
//
// span.onclick = function() {
//     modal.style.display = "none";
// }
//
// window.onclick = function(event) {
//     if (event.target === modal) {
//         modal.style.display = "none";
//     }
// }
