import axios from 'axios';


export default class SquashClient {

    token = process.env.TOKEN
    objectTypeEnum={
        project: 'project',
        testCaseFolder: 'test-case-folder'
    }
    constructor(baseUrl = process.env.SQUASH_URL + process.env.ROOT_PATH) {

        this.api = axios.create({
            baseURL: `${baseUrl }/api/rest/latest`,
            headers: { 'Content-Type': 'application/json' }
        });
        // basic auth
        // const basicAuth = btoa(`${process.env.USERNAME}:${process.env.PASSWORD}`);
        // this.api.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

    }

    getToken = () => this.api.post('/tokens', {
        'name': 'token read write',
        'permissions': 'READ_WRITE',
        'expiry_date': '2025-05-06'
    })
        .then((r) => r.data).catch((err) => console.log(err.message))

    getProjects = () => this.api.get('/projects', { params: { size: 100 } })
        .then((r) => r.data).catch((err) => console.log(err.message))

    createProject = (name, { description = '', label = '' } = {}) => {

        return this.api.post('/projects', {
            '_type': 'project',
            name,
            label,
            description
        }).then((r) => r.data).catch((err) => console.log(err.message));

    }

    getAllTestCaseFolders = () => this.api.get('/test-case-folders', { params: { size: 100 } })
        .then((r) => r.data).catch((err) => console.log(err.message))

    getProjectTestCaseFolders = (projectIds) => {

        const ids = projectIds.reduce((acc, val) => acc.concat(val, ','), '');
        console.log(ids);
        return this.api.get(`/test-case-folders/tree/${ids}`, { params: { size: 100 } })
            .then((r) => r.data).catch((err) => console.log(err.message));

    }

    createCaseFolder = (name, parentId, { description = '', parentType = 'project', customFields } = {}) => {

        const payload = {
            '_type': 'test-case-folder',
            name,
            'description': description,
            'custom_fields': customFields,
            'parent': {
                '_type': parentType,
                'id': parentId
            }
        };
        return this.api.post('/test-case-folders', payload).then((r) => r.data).catch((err) => console.log(err.message));

    }

    createTestCase = (name, parentId, { description = '', parentType = this.objectTypeEnum.testCaseFolder } = {}) => {

        const payload = {
            '_type': 'test-case',
            name,
            'parent': {
                '_type': parentType,
                'id': parentId
            },
            'importance': 'MEDIUM',
            'status': 'APPROVED',
            description,
            'steps': [
                {
                    '_type': 'action-step',
                    'action': '',
                    'expected_result': ''
                }
            ]
        };
        return this.api.post('/test-cases', payload).then((r) => r.data).catch((err) => console.log(err.message));

    }
    uploadAttachment = (owner, ownerId, buffer, opts = {}) => {

        const form = new FormData();
        const blob = new Blob([buffer], { type: opts.contentType || 'application/octet-stream' });
        form.append('files', blob, opts.filename || 'unnamed.bin');
        return this.api.postForm(`/${owner}/${ownerId}/attachments`,
            form)
            .then((r) => r.data)
            .catch((err) => console.log(err.message));

    }
    updateTestCase = (caseId, payload) => {

        return this.api.patch(`/test-cases/${caseId}`, { '_type': 'test-case', ...payload })
            .then((r) => r.data).catch((err) => console.log(err.message));

    }
    updateTestFolder = (folderId, payload) => {

        return this.api.patch(`/test-case-folders/${folderId}`, { '_type': 'test-case-folder', ...payload })
            .then((r) => r.data).catch((err) => console.log(err.message));

    }
    deleteFolders = (ids) => {

        console.log(ids.join(','));
        return this.api.delete(`test-case-folders/${ids.join(',')}`)
            .then((r) => r.data).catch((err) => console.log(err.message));

    }
    deleteProject = (id) => {

        return axios.delete(`http://localhost:8090/squash/backend/projects/${id}`, {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-xsrf-token': 'a8c30d8f-4aa4-46db-af29-6ccbc1069bfa'
            },
            'mode': 'cors',
            'referrerPolicy': 'strict-origin-when-cross-origin',
            'credentials': 'include'

        })
            .then((r) => r.data).catch((err) => console.log(err.message));

    }


}
