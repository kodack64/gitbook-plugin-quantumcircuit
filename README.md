# gitbook-plugin-quantumviz
Honkit plugin for visualizing quantum circuit.
Converting `{% qcircuit %} ... {% endqcircuit %}` tags to the SVG image of quantum circuits using [two.js](https://two.js.org/), or to the WebGL canvas using [pixi.js](https://pixijs.com/). Since the number of WebGL canvas is limited, this plugin shows image with two.js by default.

## Install

`package.json`:

```json
{
    "devDependencies": {
        "gitbook-plugin-quantumcircuit": "git+https://github.com/kodack64/gitbook-plugin-quantumcircuit",
    }
}
```

`book.json`:

```json
{
	"plugins": [
		"quantumcircuit"
	]
}
```

then run `npm update` and `npx honkit serve`.

## Usage

By inserting json-like object among the markdown, the SVG images will be automatically inserted.

```
{% qcircuit %}
{
    qubit_name: {0: "|ψ⟩", 1: "|0⟩", 2: "|0⟩"},
    register_name: {0: "s0", 1: "s1"},
    operations: [
        {name: 'X', step: 0, target: [1], measurement: true, outcome: [0] },
        {name: 'X', step: 1, target: [2], measurement: true, outcome: [1] },
        {name: 'SWAP', step: 1, target: [0, 1]},
        {name: 'SWAP', step: 2, target: [1, 2]},
        {name: 'Z', step: 3, target: [2], condition: [0]},
        {name: 'X', step: 4, target: [2], condition: [1]},
    ]
};
{% endqcircuit %}
```


The above will be converted as:
<img src="./example/bell.svg">


## Format

- `num_qubit (int)`: (optional) The number of qubit. If not assigned, determined from the maximum index of operations.
- `num_register (int)`: (optional) The number of register. If not assigned, determined from the maximum index of operations.
- `qubit_name (dict[int, str])`: (default to `{}`) The map from qubit indices to the name of them. The name is shown in the left of corresponding wire. If key not found, no text is shown.
- `register_name (dict[int, str])`: (default to `{}`) The map from register indices to the name of them. The name is shown in the left of corresponding wire. If key not found, no text is shown.
- `output_name (dict[int, str])`: (default to `{}`) The map from output-wire indices to the name of them. The name is shown in the right of corresponding wire. If key not found, no text is shown.
- `operations (list)`: (required) The list `operations` must be a list of the following `dict` objects.
  - `name (str)`: (required) The name of gate. The texts are shown in the box of gates. Several strings are registered as special strings.
  - `step (int)`: (required) The index of moment of a quantum gate.
  - `target (list[int])`: (default to `[]`) The list of indices of target qubits.
  - `control (list[int])`: (default to `[]`) The list of indices of control qubits, shown as black circle.
  - `control_neg (list[int])`: (default to `[]`) The list of indices of not-control qubits, shown as white circle.
  - `condition (list[int])`: (default to `[]`) The list of indices of conditioning classical registers.
  - `outcome (list[int])`: (default to `[]`) The list of indices of registers where the measurement gate writes.
  - `measurement (bool)`: (deafult to `false`) If true, the block becomes measurement mark.
  - `classical (bool)`: (deafult to `false`) If true, the gate acts on the classical register instead of qubit wires.

### Special gate name

The following names are considered as special key, and when conditions are satisfied, special marks are used.

- `X`: If the number of items in `control` and `control_neg` is no less than 1, a popular CNOT-block is used.
- `Z`: If the number of items in `control` is one and `control_neg` is zero, then, a popular Control-Z block is used.
- `SWAP`: If the number of items in `target` is two and has no `control` and `control_neg`, then wires are physical swapped.
- `WIRE`: If the number of items in `target` is two and has no `control` and `control_neg`, the wire of the first item in `target` is connected to the wire of the second item. 

If you want to use quantum gates with these characters, add whitespace before or after the name. These blanks are trimmed when it is used.

The above will be converted as:
<img src="./example/random.svg">
