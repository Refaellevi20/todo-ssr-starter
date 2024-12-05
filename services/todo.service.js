const fs = require('fs')
const gTodos = require('../data/todo.json')

module.exports = {
    query,
    getById,
    remove,
    save,
    getCaptcha,
}

const itemsPerPage = 100

async function query(filterBy = {}) {
    const { byVendor, page } = filterBy
    const regex = new RegExp(byVendor, 'i')
    let filteredTodos = gTodos.filter((todo) => regex.test(todo.vendor))

    if (page) {
        const startIdx = page * itemsPerPage
        const totalPages = Math.ceil(filteredTodos.length / itemsPerPage)
        filteredTodos = filteredTodos.slice(startIdx, startIdx + itemsPerPage)
    }
    return filteredTodos
}

function getById(todoId) {
    const todo = gTodos.find((todo) => todo._id === todoId)
    if (!todo) throw new Error('Unknown todo')
    return Promise.resolve(todo)
}


function remove(todoId, nickname) {
    const idx = gTodos.findIndex((todo) => todo._id === todoId)
    if (idx < 0) return Promise.reject('Unknown todo')
    if (gTodos[idx].owner !== nickname) throw new Error('Not your todo')
    gTodos.splice(idx, 1)
    return _saveTodosToFile()
}

async function save(todo, nickname) {
    var savedTodo
    if (todo._id) {
        savedTodo = gTodos.find((currTodo) => currTodo._id === todo._id)
        if (savedTodo.owner !== nickname) throw new Error('Not your todo')
        // Update only specific fields
        savedTodo.txt = todo.txt
        savedTodo.isDone = todo.isDone
    } else {
        savedTodo = {...todo, _id: _makeId(), owner: nickname || 'guest'}
        gTodos.unshift(savedTodo)
    }
    await _saveTodosToFile()
    return savedTodo
}

function _makeId(length = 5) {
    var txt = ''
    var possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return txt
}
function _saveTodosToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(gTodos, null, 2)

        fs.writeFile('data/todo.json', data, (err) => {
            if (err) return reject(err)
            resolve()
        })
    })
}

function getCaptcha() {
    return { challenge: 'What is 3+6?', ans: 9 }
}