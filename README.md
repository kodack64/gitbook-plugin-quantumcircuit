# gitbook-plugin-quantumviz
Gitbook plugin for visualizing quantum circuit.
Converting `{% qcircuit %} ... {% endqcircuit %}` tags to the content of [quantum-viz.js](https://github.com/microsoft/quantum-viz.js).

## Install

`package.json`:

```json
{
    "devDependencies": {
        "gitbook-plugin-quantumviz": "git+https://github.com/kodack64/gitbook-plugin-quantumviz",
    }
}
```

`book.json`:

```json
{
	"plugins": [
		"quantumviz"
	]
}
```

then run `npm update` and `npx honkit serve`.

## Usage

Write the content of quantum circuit according to the [Circuit scheme](https://github.com/microsoft/quantum-viz.js/wiki/API-schema-reference). Then, content will be converted to javascript snippet to paste the circuits. The 

```
To create the Bell-state, we perform quantum circuit as follows:
{% qcircuit %}
{
    qubits: [{ id: 0 }, { id: 1, numChildren: 1 }],
    operations: [
        {
            gate: 'H', 
            targets: [{ qId: 1 }],
        },
        {
            gate: 'X', 
            isControlled: true,
            controls: [{ qId: 0 }],
            targets: [{ qId: 1 }],
        },
    ],
};
{% endqcircuit %}
```
