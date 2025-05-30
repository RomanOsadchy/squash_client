import axios from 'axios';


export default class ClickUpClient {

    teamId = '4535044'
    spaceId = '42508293'
    apiToken = process.env.CLICKUP_TOKEN;
    constructor(apiToken = this.apiToken) {

        this.client = axios.create({
            baseURL: 'https://api.clickup.com/api/v2',
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json'
            }
        });

    }
    async get(url) {

        return this.client.get(url);

    }
    async getSpaceFolders(spaceId = this.spaceId) {

        return this.client.get(`/space/${spaceId}/folder`).catch((error) => console.log(error));

    }
    async getList(listId) {

        return this.client.get(`/list/${listId}`).catch((error) => console.log(error));

    }
    async getListTasks(listId) {

        return this.client.get(`/list/${listId}/task`).catch((error) => console.log(error));

    }
    async getTask(taskId) {

        return this.client.get(`/task/${taskId}?include_subtasks=true&include_markdown_description=true`).catch((error) => console.log(error));

    }

    async getTaskComments(taskId) {

        return this.client.get(`/task/${taskId}/comment`).catch((error) => console.log(error));

    }

}

// Example usage

