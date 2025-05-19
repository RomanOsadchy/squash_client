import ClickUpClient from './clickUp-client/clickUpClient.js';
import SquashClient from './squash-client/squash-client.js';
import axios from 'axios';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import fs from 'fs';
const require = createRequire(import.meta.url);

dotenv.config({ path: './.env' });

(async () => {

    const squashClient = new SquashClient();
    const client = new ClickUpClient();
    fs.writeFileSync('qwe.json', JSON.stringify({ tasks: [] }, null, 2), 'utf8');
    const response = await client.getSpaceFolders();
    const faceSdkFolder = response.data.folders.find((f) => f.name === 'Mobile SDK: Document Reader');
    const project = await squashClient.createProject(faceSdkFolder.name, {
        description: '<h1 style="font-family: Arial, sans-serif; font-size: 2.5em; color: #a84caf; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 10px; background: linear-gradient(90deg, #e0f7fa, #8b4caf); display: inline-block;">\n' +
                '  Face SDK\n' +
                '</h1>'
    });
    const testScenariosList = faceSdkFolder.lists.find((l) => l.name === 'Test Scenarios & Cases');
    const listTasks = await (await client.getListTasks(testScenariosList.id)).data;
    if (listTasks.length > 100) throw new Error(`Too many tasks in ${testScenariosList.name}`);
    for (const task of listTasks.tasks) {

        async function handleSubtasks(task, parentId, parentType = 'test-case-folder', root = false) {

            await sleep(1000);
            task = (await client.getTask(task.id)).data;
            const comments = (await client.getTaskComments(task.id)).data;
            const description = `<h4>${handleUrlStrings(task.markdown_description, comments)}</h4>`;
            const tasks = await require('/Users/osachi/js_projects/squash_client/qwe.json');
            tasks.tasks.push(task);
            fs.writeFileSync('qwe.json', JSON.stringify(tasks, null, 2), 'utf8');
            const attachments = task.attachments;
            let folder;
            let testCase;

            if (task.subtasks || root) {

                folder = await squashClient.createCaseFolder(task.name, parentId, { parentType, description });
                for (const subtask of task.subtasks ?? []) {

                    await handleSubtasks(subtask, folder.id);

                }

            } else {

                testCase = await squashClient.createTestCase(task.name, parentId, { parentType, description });

            }
            if (attachments && attachments.length) {

                const imageTags = [];
                for (const attachment of attachments) {

                    const owner = folder ? 'test-case-folders' : 'test-cases';
                    const ownerId = folder?.id ?? testCase.id;
                    try {

                        const buffer = (await axios.get(attachment.url, { responseType: 'arraybuffer' })).data;
                        const uploadResponse = await squashClient.uploadAttachment(owner, ownerId, buffer, { filename: attachment.title });
                        const squashAttachments = uploadResponse._embedded.attachments;
                        for (const squashAttachment of squashAttachments) {

                            const contentHref = `${squashAttachment._links.self.href}/content`;
                            const format = attachment.title.split('.').at(-1);
                            const tag = ['log', 'zip', 'json', 'yaml', 'yml', 'xml', 'bson', 'mov', 'mp4', 'license'].includes(format) ?
                                `<a href="${contentHref}">${attachment.title}</a>` :
                                `<img src="${contentHref}" alt="image.png">`;
                            imageTags.push(tag);

                        }

                    } catch (e) {

                        console.error('attachment error: \n', e);

                    }

                }
                const newDescription = `<h4>${handleUrlStrings(task.markdown_description, comments)}<br>${imageTags.join('<br>')}</h4>`;
                if (folder?.id) {

                    await squashClient.updateTestFolder(folder.id, { description: newDescription });

                }
                if (testCase?.id) {

                    await squashClient.updateTestCase(testCase.id, { description: newDescription });

                }

            }

        }
        await handleSubtasks(task, project.id, 'project', true);
        // console.log(task.checklists[0].items)

    }

})();

function handleUrlStrings(string, comments) {

    if (typeof string === 'string') {

        const urlRegex = /\[?(https?:\/\/[^\s\)\]]+)\]?\((https?:\/\/[^\)]+)\)|\bhttps?:\/\/[^\s\)\]]+/g;
        if (comments && comments.comments.length) {

            string = `${string}<br>comments:`;
            for (const comment of comments.comments) {

                const commentText = comment.comment.map((c) => {

                    if (c.type !== 'task_mention') return c.text;
                    else return `https://app.clickup.com/t/${c.task_mention.task_id}`;

                }).join('');
                string = `${string }<br>${commentText}`;

            }

        }
        const result = string.replace(urlRegex, (match, p1, p2) => {

            if (p1 && p2 && p1 === p2) {

                return `<a href="${p2}">${p2}</a>`;

            } else if (p1 && p2) {

                return `<a href="${p2}">${p1}</a>`;

            } else {

                return `<a href="${match}">${match}</a>`;

            }

        });
        return result.replaceAll('\n', '<br>');

    }
    return string;

}

function sleep(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}
