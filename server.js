const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const path = require('path')

const todoService = require('./services/todo.service')

const app = express()
const port = 3030
const VIEW_DIR = `${__dirname}/views`

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(session({
    secret: 'puki muki',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/puki', (req, res) => res.send('Hello Puki!'))
app.get('/muki', (req, res) => res.redirect('/puki'))

app.get('/', (req, res) => {
    const captcha = { challenge: 'What is  3+6?', ans: 9 }
    req.session.captchaAns = captcha.ans
    res.render('index', { title: 'Welcome to Todo SSR', challenge: captcha.challenge })
})

app.get('/todo', async (req, res) => {
    const { nickname } = req.session
    const todos = await todoService.query()
    const data = {
        title: (nickname) ? nickname + ' Welcome:' : 'Guest, please login',
        todos
    }
    res.render(`${VIEW_DIR}/todos.ejs`, data)
})

app.get('/todo/edit/:todoId?', async (req, res) => {
    const todoId = req.params.todoId
    var todo = {}
    if (todoId) {
        todo = await todoService.getById(todoId)
    }
    res.render(`${VIEW_DIR}/todo-edit.ejs`, { todo })
})

app.post('/todo/delete', async (req, res) => {
    const { todoId } = req.body
    try {
        await todoService.remove(todoId, req.session.nickname)
        res.redirect('/todo')

    } catch (err) {
        console.log('Cannot remove todo', err)
        res.status(400).send('Cannot remove todo')
    }
})

app.post('/todo/save', async (req, res) => {
    const todo = req.body
    todo.isDone = todo.isDone === 'true'

    try {
        const savedTodo = await todoService.save(todo, req.session.nickname)
        res.redirect(`/todo/${savedTodo._id}`)
    }
    catch (err) {
        console.log('Cannot add todo', err)
        res.status(400).send('Cannot add todo')
    }
})

app.get('/todo/:todoId', async (req, res) => {
    const { todoId } = req.params
    try {
        const todo = await todoService.getById(todoId)
        res.render(`${VIEW_DIR}/todo.ejs`, { todo })
    } catch (err) {
        console.log('Cannot get todo', err)
        res.status(400).send('Cannot get todo')
    }
})

app.post('/setUser', (req, res) => {
    const userAnswer = parseInt(req.body.captcha, 10)
    const correctAnswer = req.session.captchaAns

    if (userAnswer === correctAnswer) {
        req.session.nickname = req.body.nickname
        res.redirect('/todo')
    } else {
        res.status(400).send('<h1>CAPTCHA failed. Please go back and try again.</h1>')
    }
})

app.listen(port, () => console.log(`Todo SSR Server - listening on port ${port}`))
