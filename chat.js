import Assistant from "./assistant.js"
import Scenario from "chat-scenario"
import fs from "fs"
import prompts from "prompts";
import ora from "ora";

const debug = false
const dump = (...args) => debug && console.log(...args)

// prepare to start

const ai = new Assistant()
const scenarioText = await readScenario();
const scenario = new Scenario(scenarioText, {
    actions: {output}
})

// start

scenario.start()
let userInput = {}
let history = []
const userFirst = (scenario.actConfig.order ?? ['assistant', 'user'])[0] === 'user'
const order = userFirst ? [user, nextAct, assistant] : [nextAct, assistant, user]

if (userFirst) outputDefault()

// loop over scenario until the end
while (scenario.hasNext) {
    for (const action of order) {
        await action()
    }
    
    if (scenario.actConfig.loop === true || scenario.actConfig.loop === scenario.act) {
        scenario.queue.unshift(scenario.act)
    }
}

exit()

/* helpers */

function exit(message) {
    output(message ?? '--- The end! ---')
    output()
    // dump(scenario.history)
    process.exit(0)
}

function output(message) {
    return console.log(message ?? '')
}

async function readScenario() {
    const files = fs.readdirSync('./scenarios')
        .filter(file => file.endsWith('.scenario'))
        .map(file => file.replace('.scenario', ''))

    const file = files.length > 1 ? await prompts({
        type: 'select',
        name: 'scenario',
        message: 'Select a scenario',
        choices: files.map(file => ({
            title: file[0].toUpperCase() + file.slice(1).replace(/_/g, ' '),
            value: file
        })),
    }) : {scenario: files[0]}

    if (!file.scenario) {
        exit('No scenario selected, exiting...')
    }

    return fs.readFileSync(`./scenarios/${file.scenario}.scenario`, 'utf-8')
}

async function assistant() {
    dump('--- Assistant ---')
    dump(history)
    const spinner = ora('Thinking...').start()
    const answer = await ai.ask(history)
    spinner.stop()
    if (!answer) exit()
    scenario.answer(answer)
    output(answer.content)
}

async function user() {
    dump(`--- User (${scenario.act}: ${scenario.placeholders}) ---`)
    if (scenario.act && !(userFirst ? scenario.placeholders : scenario.nextPlaceholders).length) {
        userInput = {}
        return
    }

    const name = scenario.actConfig.inputPlaceholder ?? 'userInput'
    const message = (userFirst ? scenario.nextConfig : scenario.actConfig)?.prompt ?? ''
    userInput = await prompts({
        name,
        message,
        type: 'text',
    }, {onCancel: () => exit()})

    if (scenario.actConfig.stopwords?.includes?.(userInput[name])) exit()
}

function nextAct() {
    dump(`--- Update history to ${scenario.hasNext} ---`)
    history = scenario.next(userInput, true)
}

function outputDefault() {
    scenario.scenario.default
        ?.filter(message => message.role === 'output')
        .forEach(message => {
            output(message.content)
            message.role = scenario.config.comment + message.role
        })
}
