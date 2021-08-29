class Drawer {
    constructor(tag, circuit_dict) {
        this.tagname = tagname;
        this.circuit_dict = circuit_dict;

        this.sanitize_circuit();
        this.set_constant();
        this.adjust();

        this.app = new PIXI.Application({ width: this.canvas_width, height: this.canvas_height, antialias: true, backgroundColor: 0xffffff });
        this.app.stage.sortableChildren = true;
        tag.appendChild(this.app.view)
    }
    sanitize_circuit() {
        for (let operation of this.circuit_dict.operation) {
            if (!("name" in operation)) {
                operation.name = ""
            }
            if (!("qubit_name" in operation)) {
                operation.qubit_name = {}
            }
            if (!("register_name" in operation)) {
                operation.register_name = {}
            }
            if (!("target" in operation)) {
                operation.target = []
            }
            if (!("measurement" in operation)) {
                operation.measurement = false;
            }
            if (!("control" in operation)) {
                operation.control = []
            }
            if (!("control_neg" in operation)) {
                operation.control_neg = []
            }
            if (!("outcome" in operation)) {
                operation.outcome = []
            }
            if (!("condition" in operation)) {
                operation.condition = []
            }
            const qubit_connect_list = ([0]).concat(operation.target).concat(operation.control).concat(operation.control_neg);
            operation.max_qubit_index = Math.max.apply(Math, qubit_connect_list);
            operation.min_qubit_index = Math.min.apply(Math, qubit_connect_list);
            const register_connect_list = ([]).concat(operation.condition).concat(operation.outcome)
            if (register_connect_list.length == 0) {
                operation.max_register_index = -1;
                operation.min_register_index = -1;
            } else {
                operation.max_register_index = Math.max.apply(Math, register_connect_list);
                operation.min_register_index = Math.min.apply(Math, register_connect_list);
            }
        }
        if (!("qubit_name" in this.circuit_dict)) {
            this.circuit_dict.qubit_name = {};
        }
        if (!("register_name" in this.circuit_dict)) {
            this.circuit_dict.register_name = {};
        }
        if (!("num_qubit" in this.circuit_dict)) {
            let max_qubit_index = 0;
            for (let operation of this.circuit_dict.operation) {
                max_qubit_index = Math.max(max_qubit_index, operation.max_qubit_index)
            }
            this.circuit_dict.num_qubit = max_qubit_index + 1;
        }
        if (!("num_register" in this.circuit_dict)) {
            let max_register_index = -1;
            for (let operation of this.circuit_dict.operation) {
                max_register_index = Math.max(max_register_index, operation.max_register_index)
            }
            this.circuit_dict.num_register = max_register_index + 1;
        }
    }
    set_constant() {
        this.x_step = 60;
        this.y_step = 60;
        this.x_padding = this.x_step * 0.7;
        this.y_padding = this.y_step * 0.7;
        this.wire_width = 2;
        this.z_wire = -3;
        this.z_wire_erase = -2;
        this.z_rewire = -1;
    }
    adjust() {

        // get max step
        let max_step = 0;
        for (let operation of this.circuit_dict.operation) {
            max_step = Math.max(operation.step, max_step);
        }
        this.max_step = max_step;

        this.canvas_width = (max_step + 2) * this.x_step + this.x_padding * 2;
        this.canvas_height = (this.circuit_dict.num_qubit + this.circuit_dict.num_register) * this.y_step;
    }

    draw() {
        const max_step = this.max_step;

        // draw qubit wire and name
        const num_qubit = this.circuit_dict.num_qubit;
        for (let qubit_index = 0; qubit_index < num_qubit; qubit_index += 1) {
            this.draw_wire(0.3, qubit_index, max_step + 1 + 0.3, qubit_index);
            let qubit_name = this.circuit_dict.qubit_name[qubit_index];
            if (qubit_name !== undefined) {
                this.draw_wire_name(qubit_index, qubit_name);
            }
        }

        // draw register wire and name
        const num_register = this.circuit_dict.num_register;
        for (let register_index = 0; register_index < num_register; register_index += 1) {
            this.draw_dual_wire(0.3, num_qubit + register_index, max_step + 1, num_qubit + register_index);
            let register_name = this.circuit_dict.register_name[register_index];
            if (register_name !== undefined) {
                this.draw_wire_name(num_qubit + register_index, register_name);
            }
        }

        // draw operation
        for (let operation of this.circuit_dict.operation) {
            this.draw_operation(num_qubit, operation)
        }
    }

    check_operation_type(operation) {
        if (operation.measurement) {
            return "MEASUREMENT";
        } else if (operation.name == "X" && operation.control.length + operation.control_neg.length >= 1) {
            return "CONTROL_X";
        } else if (operation.name == "Z" && operation.control.length >= 1 && operation.control_neg.length == 0) {
            return "CONTROL_Z"
        } else if (operation.name == "SWAP" && operation.target.length == 2 && operation.control.length + operation.control_neg.length == 0) {
            return "SWAP";
        } else if (operation.name == "WIRE" && operation.target.length == 2 && operation.control.length + operation.control_neg.length == 0) {
            return "WIRE";
        } else if (this.is_subsequent(operation.target)) {
            return "MERGED_GATE"
        } else {
            return "NORMAL";
        }
    }
    get_position(pos_x, pos_y) {
        return [this.x_padding + pos_x * this.x_step, this.y_padding + pos_y * this.y_step];
    }
    draw_operation(num_qubit, operation) {
        const qubit_connect_list = operation.target.concat(operation.control).concat(operation.control_neg);
        const min_qubit_index = Math.min.apply(Math, qubit_connect_list);
        const max_qubit_index = Math.max.apply(Math, qubit_connect_list);
        const min_condition_index = Math.min.apply(Math, operation.condition);
        const max_condition_index = Math.max.apply(Math, operation.condition);
        const min_outcome_index = Math.min.apply(Math, operation.outcome);
        const max_outcome_index = Math.max.apply(Math, operation.outcome);
        const step = operation.step + 1;
        const type = this.check_operation_type(operation);

        if (!(type == "SWAP" || type == "MERGED_GATE" || type == "WIRE")) {
            this.draw_connect(step, min_qubit_index, max_qubit_index);
        }

        this.draw_dual_wire(step, max_qubit_index, operation.step + 1, num_qubit + max_outcome_index);
        for (let outcome_index of operation.outcome) {
            this.draw_not(step, num_qubit + outcome_index);
        }

        this.draw_dual_wire(step, max_qubit_index, operation.step + 1, num_qubit + max_condition_index);
        for (let condition_index of operation.condition) {
            this.draw_black_dot(step, num_qubit + condition_index);
        }

        this.draw_gate(step, operation, type);

        for (let control_index of operation.control) {
            this.draw_black_dot(step, control_index, operation.name);
        }

        for (let control_index of operation.control_neg) {
            this.draw_white_dot(step, control_index, operation.name);
        }
    }
    draw_wire_name(pos_y, name) {
        const fontSize = this.x_step * 0.3;
        let pos = this.get_position(0, pos_y);
        const text = new PIXI.Text(name.trim(), { align: "center", fontSize: fontSize });
        text.x = pos[0];
        text.y = pos[1];
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        this.app.stage.addChild(text);
    }
    draw_wire(pos_x_start, pos_y_start, pos_x_end, pos_y_end) {
        const wire = new PIXI.Graphics();
        wire.lineStyle(this.wire_width, 0x888888, 1);
        const pos1 = this.get_position(pos_x_start, pos_y_start);
        const pos2 = this.get_position(pos_x_end, pos_y_end);
        wire.moveTo(pos1[0], pos1[1]);
        wire.lineTo(pos2[0], pos2[1]);
        wire.zIndex = this.z_wire;
        this.app.stage.addChild(wire);
    }
    draw_dual_wire(pos_x_start, pos_y_start, pos_x_end, pos_y_end) {
        const wire_gap = this.y_step * 0.03;
        const wire_width = 1;
        const wire = new PIXI.Graphics();
        wire.lineStyle(wire_width, 0x000000, 1);
        const pos1 = this.get_position(pos_x_start, pos_y_start);
        const pos2 = this.get_position(pos_x_end, pos_y_end);
        const angle = Math.atan2(pos2[1] - pos1[1], pos2[0] - pos1[0]) + Math.PI / 2;
        wire.moveTo(pos1[0] + wire_gap * Math.cos(angle), pos1[1] + wire_gap * Math.sin(angle));
        wire.lineTo(pos2[0] + wire_gap * Math.cos(angle), pos2[1] + wire_gap * Math.sin(angle));
        wire.moveTo(pos1[0] - wire_gap * Math.cos(angle), pos1[1] - wire_gap * Math.sin(angle));
        wire.lineTo(pos2[0] - wire_gap * Math.cos(angle), pos2[1] - wire_gap * Math.sin(angle));
        this.app.stage.addChild(wire);
    }
    draw_connect(pos_x, pos_y_start, pos_y_end) {
        const wire = new PIXI.Graphics();
        wire.lineStyle(this.wire_width, 0x888888, 1);
        const pos1 = this.get_position(pos_x, pos_y_start);
        const pos2 = this.get_position(pos_x, pos_y_end);
        wire.moveTo(pos1[0], pos1[1]);
        wire.lineTo(pos2[0], pos2[1]);
        this.app.stage.addChild(wire);
    }
    is_subsequent(target_list) {
        if (target_list.length <= 1) return false;
        target_list.sort();
        let value = -1;
        for (let index of target_list) {
            if (value == -1) value = index;
            else if (index == value + 1) value += 1;
            else return false;
        }
        return true;
    }
    draw_gate(step, operation, type) {
        const target_list = operation.target;
        const name = operation.name;
        if (type == "MEASUREMENT") {
            for (let target_index of target_list) {
                this.draw_measurement(step, target_index, name);
            }
        } else if (type == "CONTROL_X") {
            for (let target_index of target_list) {
                this.draw_not(step, target_index);
            }
        } else if (type == "CONTROL_Z") {
            for (let target_index of target_list) {
                this.draw_black_dot(step, target_index);
            }
        } else if (type == "SWAP") {
            this.draw_rewire(step, target_list[0], target_list[1]);
            this.draw_rewire(step, target_list[1], target_list[0]);
        } else if (type == "WIRE") {
            this.draw_rewire(step, target_list[0], target_list[1]);
        } else if (this.is_subsequent(target_list)) {
            const min_target_index = Math.min.apply(Math, target_list);
            const max_target_index = Math.max.apply(Math, target_list);
            this.draw_merged_box(step, min_target_index, max_target_index, name);
        } else {
            for (let target_index of target_list) {
                this.draw_box(step, target_index, name);
            }
        }
    }
    draw_merged_box(pos_x, pos_y0, pos_y1, name) {
        const squareWidth = this.x_step * 0.7;
        const squareHeight = this.y_step * (pos_y1 - pos_y0 + 1 - 0.3);
        const fontSize = this.x_step * 0.6 / Math.max(name.trim().length, 1);
        let pos = this.get_position(pos_x, (pos_y0 + pos_y1) / 2);
        let x = pos[0];
        let y = pos[1];
        const square = new PIXI.Graphics();
        square.lineStyle(2, 0x000000, 1);
        square.beginFill(0xcde9f7);
        square.drawRect(x - squareWidth / 2, y - squareHeight / 2, squareWidth, squareHeight);
        square.endFill();
        const text = new PIXI.Text(name.trim(), { align: "center", fontSize: fontSize });
        text.x = x;
        text.y = y;
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        square.addChild(text);
        this.app.stage.addChild(square);
    }
    draw_box(pos_x, pos_y, name) {
        const squareWidth = this.x_step * 0.7;
        const squareHeight = this.y_step * 0.7;
        const fontSize = this.x_step * 0.5 / Math.max(name.trim().length, 1);
        let pos = this.get_position(pos_x, pos_y);
        let x = pos[0];
        let y = pos[1];
        const square = new PIXI.Graphics();
        square.lineStyle(2, 0x000000, 1);
        square.beginFill(0xcde9f7);
        square.drawRect(x - squareWidth / 2, y - squareHeight / 2, squareWidth, squareHeight);
        square.endFill();
        const text = new PIXI.Text(name.trim(), { align: "center", fontSize: fontSize });
        text.x = x;
        text.y = y;
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        square.addChild(text);
        this.app.stage.addChild(square);
    }
    draw_not(pos_x, pos_y) {
        const circleSize = this.x_step * 0.2;
        let pos = this.get_position(pos_x, pos_y);
        const circle = new PIXI.Graphics();
        circle.lineStyle(2, 0x000000, 1);
        circle.beginFill(0xFFFFFF, 1);
        circle.drawCircle(pos[0], pos[1], circleSize);
        circle.endFill();
        circle.moveTo(pos[0], pos[1] + circleSize);
        circle.lineTo(pos[0], pos[1] - circleSize);
        circle.moveTo(pos[0] + circleSize, pos[1]);
        circle.lineTo(pos[0] - circleSize, pos[1]);
        this.app.stage.addChild(circle);
    }
    draw_black_dot(pos_x, pos_y) {
        const circleSize = this.x_step * 0.1;
        let pos = this.get_position(pos_x, pos_y);
        const circle = new PIXI.Graphics();
        circle.lineStyle(2, 0x000000, 1);
        circle.beginFill(0x000000, 1);
        circle.drawCircle(pos[0], pos[1], circleSize);
        circle.endFill();
        this.app.stage.addChild(circle);
    }
    draw_white_dot(pos_x, pos_y) {
        const circleSize = this.x_step * 0.1;
        let pos = this.get_position(pos_x, pos_y);
        const circle = new PIXI.Graphics();
        circle.lineStyle(2, 0x000000, 1);
        circle.beginFill(0xFFFFFF, 1);
        circle.drawCircle(pos[0], pos[1], circleSize);
        circle.endFill();
        this.app.stage.addChild(circle);
    }
    draw_rewire(pos_x, pos_y1, pos_y2) {
        const swap_gap = this.x_step * 0.6;
        let pos1 = this.get_position(pos_x, pos_y1);
        let pos2 = this.get_position(pos_x, pos_y2);

        const wire_eraser = new PIXI.Graphics();
        wire_eraser.lineStyle(3, 0xFFFFFF, 1);
        wire_eraser.moveTo(pos1[0] - swap_gap / 2, pos1[1]);
        wire_eraser.lineTo(pos1[0] + swap_gap / 2, pos1[1]);
        wire_eraser.zIndex = this.z_wire_erase;

        const wire = new PIXI.Graphics();
        wire.lineStyle(2, 0x888888, 1);
        wire.moveTo(pos1[0] - swap_gap / 2, pos1[1]);
        wire.lineTo(pos2[0] + swap_gap / 2, pos2[1]);
        wire.zIndex = this.z_rewire;
        this.app.stage.addChild(wire);
        this.app.stage.addChild(wire_eraser);
    }
    draw_measurement(pos_x, pos_y, name) {
        const squareWidth = this.x_step * 0.7;
        const squareHeight = this.y_step * 0.7;
        const arcSize = this.x_step * 0.2;
        const arrowSize = this.x_step * 0.3;
        const arrowAngle = -Math.PI * 0.3;
        const fontSize = 16;
        let pos = this.get_position(pos_x, pos_y);
        let x = pos[0];
        let y = pos[1];
        const square = new PIXI.Graphics();
        square.lineStyle(2, 0x000000, 1);
        square.beginFill(0xFFFFFF);
        square.drawRect(x - squareWidth / 2, y - squareHeight / 2, squareWidth, squareHeight);
        square.endFill();
        const arc = new PIXI.Graphics();
        arc.lineStyle(2, 0x000000, 1);
        arc.arc(x, y + squareWidth * 0.0, arcSize, Math.PI, 2 * Math.PI);
        square.addChild(arc);
        const arrow = new PIXI.Graphics();
        arrow.lineStyle(2, 0x000000, 1);
        arrow.moveTo(x, y + squareWidth * 0.05);
        arrow.lineTo(x + arrowSize * Math.cos(arrowAngle), y + squareWidth * 0.05 + arrowSize * Math.sin(arrowAngle));
        square.addChild(arrow);
        if (name.trim().length == 0) name = "Z";
        const text = new PIXI.Text(name.trim(), { align: "center", fontSize: fontSize });
        text.x = x;
        text.y = y + this.y_step * 0.2;
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        square.addChild(text);
        this.app.stage.addChild(square);
    }
}

/*
function draw_circuit(tag, circuit_dict) {
    drawer = new Drawer("#qc", circuit_dict);
    drawer.draw();
}
*/
/*
window.addEventListener("load", () => {
    const circuit_dict = {
        num_qubit: 8,
        num_register: 2,
        qubit_name: { 2: "|0⟩", 5: "|ψ⟩" },
        register_name: { 0: "m0", 1: "m1" },
        operation: [
            { name: "H", step: 0, target: [0, 3], control: [1] },
            { name: "U1", step: 1, target: [0, 3], control: [1] },
            { name: "X", step: 2, target: [0, 2], control: [1], control_neg: [3] },
            { name: "Z", step: 3, target: [1], outcome: [0], measurement: true },
            { name: "V", step: 4, target: [0], condition: [0] },
            { name: "HOGE", step: 0, target: [4], control: [5] },
            { name: "SWAP", step: 5, target: [0, 2] },
            { name: "WIRE", step: 5, target: [3, 4] },
            { name: "WIRE", step: 5, target: [4, 6] },
            { name: "WIRE", step: 5, target: [6, 3] },
            { name: "ZZ", step: 6, target: [1, 2], outcome: [0, 1], measurement: true },
            { name: "U2", step: 2, target: [4, 5] },
        ],
    }
    const tag = "#qc";
    draw_circuit(tag, circuit_dict);
})
*/