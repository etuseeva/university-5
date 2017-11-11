const js2xmlparser = require("js2xmlparser");
const fs = require('fs');

function readFile(fileName) {
    return fs.readFileSync(fileName, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        return data;
    });
}

function writeFile(fileName, text) {
    fs.writeFileSync(fileName, text, function (err) {
        if (err) {
            throw err;
        }
    });
}

// function objToXML(name, obj) {
//     const xml = js2xmlparser.parse(name, obj);
//     writeFile(`xml_${name}.txt`, xml);
// }

//Входные данные - список списков, выход - БНФ графа
function first(data) {
    //Todo: проверки валидности
    data = data.split('\r').join('').split(' ').join('');

    const lines = data.split('\n');

    const objGraph = [];
    lines.forEach(line => {
        const [vertex, vertexesStr] = line.split(':');
        const vertexes = vertexesStr.split(',');
        objGraph.push([vertex, vertexes]);
    });

    return fromObjToBNF(objGraph);
}

function fromObjToBNF(objGraph) {
    const bnf = {};
    const usedVertexes = [];

    objGraph.forEach(obj => {
        const [vertex, vertexes] = obj;
        bnf[vertex] = [];
        vertexes.forEach(v => {
            if (v !== '') {
                let num;
                if (!usedVertexes[v]) {
                    usedVertexes[v] = 1;
                    num = 1;
                } else {
                    num = ++usedVertexes[v];
                }
                bnf[vertex].push(`${num}-${v}`);
            } else {
                bnf[vertex].push('_');
            }
        });
    });

    let answer = '';
    for (const vertex in bnf) {
        answer += `${vertex} : `;

        const bnfVer = bnf[vertex];
        bnfVer.forEach((v, i) => {
            const postfix = i === bnfVer.length - 1 ? '' : ', ';
            answer += `${v}${postfix}`;
        });
        answer += '\n';
    }

    return answer;
}

function readGraph(fileName) {
    let data = readFile(fileName);
    data = data.split('\r').join('').split(' ').join('');

    const graph = {};

    const lines = data.split('\n');
    lines.forEach(line => {
        const [vertex, vertexesStr] = line.split(':');
        graph[vertex] = vertexesStr.split(',').filter(v => v !== '');
    });

    return graph;
}

//Входные данные - БНФ графа, Выход - функция
function second(data) {
    //Todo: проверки валидности
    //Todo: проверка на циклы

    data = data.split('\r').join('').split(' ').join('');

    const graphEdges = [];
    const sinks = [];

    const lines = data.split('\n');
    lines.forEach(line => {
        if (line !== '') {
            const [vertex, vertexesStr] = line.split(':');
            const vertexes = vertexesStr.split(',');
            vertexes.forEach(v => {
                if (v === '_') {
                    sinks.push(vertex);
                } else {
                    graphEdges.push([vertex, v.split('-')[1]]);
                }
            });
        }
    });

    let answer = {};
    sinks.forEach(s => {
        answer[s] = getVertexesForSink(s, graphEdges);
    });

    console.log(JSON.stringify(answer));

    answer = JSON.stringify(answer);

    const signs = ['"', ':', '{', '}'],
        newSigns = ['', '', '(', ')'];

    signs.forEach((s, i) => {
        answer = answer.split(s).join(newSigns[i]);
    });

    return answer;
}

function getVertexesForSink(sink, graphEdges) {
    const answer = {};
    for (let i = 0; i < graphEdges.length; i++) {
        if (graphEdges[i][1] === sink) {
            let vertex = graphEdges[i][0];
            graphEdges.splice(i--, 1);
            answer[vertex] = getVertexesForSink(vertex, graphEdges);
        }
    }
    return answer;
}

function third() {
    const dataGraph = readFile('input1.txt');
    const bnf = first(dataGraph);
    let funcGraph = second(bnf);
    console.log(funcGraph);

    let dataOperations = readFile('input2.txt');
    dataOperations = dataOperations.split('\r').join('').split(' ').join('');

    const operations = {};

    // const constOperations = {
    //     '+': '+',
    //     '*': '*',
    //     '&': '&',
    //     '|': '',
    //     '^': '',
    //     '>>': '',
    //     '<<': '',
    //     '!': '',
    // };

    const lines = dataOperations.split('\n');
    lines.forEach(line => {
        const parse = line.split(':');
        if (parse[1] !== '') {
            operations[parse[0]] = parse[1];
        }
    });
    console.log(operations);

    for (let i = 0; i < funcGraph.length; i++) {
        if (funcGraph[i] >= '0' && funcGraph[i] <= '9') {
            let j = i + 1;
            while (funcGraph[j] >= '0' && funcGraph[j] <= '9') {
                j++;
            }

            funcGraph = `${funcGraph.slice(0, j)}${funcGraph.slice(j + 2)}`;
            i = j - 1;
        }
    }

    console.log(funcGraph);
}

//Выходные данные - функция графа, Выход - БНФ графа
function fourth(data) {
    let signs = ['(', '(', ')'],
        newSigns = [':(', '{', '}'];

    signs.forEach((s, i) => {
        data = data.split(s).join(newSigns[i]);
    });
    data = data.substr(1);

    signs = ['{', '}', ':', ','];

    let dataCopy = '';
    for (let i = 0; i < data.length; i++) {
        if (signs.find(s => s === data[i])) {
            dataCopy += data[i];
        } else {
            let j = i + 1;
            while (!signs.find(s => s === data[j])) {
                j++;
            }
            dataCopy += `"${data.substring(i, j)}"`;
            i = j - 1;
        }
    }

    // console.log(data);
    // console.log(dataCopy);

    //Todo: проверка на корректность
    const funcObj = JSON.parse(dataCopy);
    console.log(funcObj);

    const listEdges = {};
    fromFuncToGraph(funcObj, listEdges);
    console.log(listEdges);

    const objGraph = [];
    for (const v in listEdges) {
        if (listEdges[v].length === 0) {
            listEdges[v].push('');
        }
        objGraph.push([v, listEdges[v]]);
    }

    return fromObjToBNF(objGraph);
}

function fromFuncToGraph(funcObj, answer) {
    for (const vertex in funcObj) {
        if (!answer[vertex]) {
            answer[vertex] = [];
        }

        if (funcObj[vertex] !== {}) {
            const parents = [];
            for (const v in funcObj[vertex]) {
                parents.push(v);
            }
            parents.forEach(p => {
                if (!answer[p]) {
                    answer[p] = [];
                }
                answer[p].push(vertex);
            });
        }
        fromFuncToGraph(funcObj[vertex], answer);
    }
}

function main() {
    const fileInput = 'input.txt', fileOutput = 'output.txt';

    // let data = readFile(fileInput);
    // writeFile(fileOutput, first(data));
    // writeFile(fileOutput, second(data));
    // writeFile(fileOutput, fourth(data));

    third();
}

main();


// const stdin = process.openStdin();
// stdin.addListener("data", function(d) {
//     console.log("you entered: [" +
//         d.toString().trim() + "]");
// });