import SquashClient from './squash-client.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({path: '../.env'});
const client = new SquashClient();
async function main (){
    // const projectName = 'Test Project 5'
    // const projects = (await client.getProjects())._embedded.projects
    // let project = projects.find(p => p.name === projectName);
    // if (!project) {
    //     project = (await client.createProject(projectName, {description: "<h1 style='color: mediumvioletred'>Test description</h1>"}))
    // }
    // Object.freeze(project)
    // const folder = await client.createCaseFolder('test3', project.id, {description: "<h1 style='color: mediumvioletred'>Test description</h1>"})
    // console.log(folder)
    // const subFolder = await client.createCaseFolder('test4', folder.id, {parentType: client.objectTypeEnum.testCaseFolder})
    // const projectTestCaseFolders = (await client.getProjectTestCaseFolders([project.id]))[0].folders
    // console.log(projectTestCaseFolders)
    // const testCase = await client.createTestCase('qwer', subFolder.id)
    // console.log(testCase)
    const testResults = fs.readFileSync('./results.txt', 'utf-8');
    await createStructureFromResults(client, 'Proc manager service', testResults);
}


main()
// client.getProjectTestCaseFolders([3]).then(console.log)
// console.log('af8c3ec85aa170dd53eed0325c09303c482e1e011c4af76e9a15d03d19c45f45')


function parseTestResults(testResults) {
    const lines = testResults.split('\n');
    const tree = [];
    const stack = [{ level: -1, children: tree }];

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const level = line.search(/\S/);
        const isTest = /^✔|- /.test(trimmed);

        const node = {
            name: trimmed.replace('✔', '').replace('-', '').trim(),
            isTest,
            children: []
        };

        while (stack.length && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        stack[stack.length - 1].children.push(node);
        if (!isTest) {
            stack.push({ level, children: node.children });
        }
    }

    return tree;
}

async function createStructureFromResults(client, projectName, testResults) {
    const tree = parseTestResults(testResults);
    const project = await client.createProject(projectName, {description: '<h1 style="font-family: Arial, sans-serif; font-size: 2.5em; color: #a84caf; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 10px; background: linear-gradient(90deg, #e0f7fa, #8b4caf); display: inline-block;">\n' +
            '  Proc Manager Tests\n' +
            '</h1>'});
    const projectId = project.id;

    async function processNode(node, parentId, parentType = 'project') {
        if (node.isTest) {
            return client.createTestCase(node.name, parentId, { parentType });
        } else {
            const folder = await client.createCaseFolder(node.name, parentId, { parentType });
            console.log(folder)
            const folderId = folder.id;

            for (const child of node.children) {
                await processNode(child, folderId, 'test-case-folder');
            }
        }
    }

    for (const node of tree) {
        await processNode(node, projectId);
    }
}
