import axios from "axios";


export default class SquashClient{
    token = process.env.TOKEN
    objectTypeEnum={
        project: "project",
        testCaseFolder: "test-case-folder"}
    constructor(baseUrl=process.env.SQUASH_URL){

        this.api = axios.create({
            baseURL: baseUrl + '/api/rest/latest',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // basic auth
        // const basicAuth = btoa(`${process.env.USERNAME}:${process.env.PASSWORD}`);
        // this.api.defaults.headers.common['Authorization'] = `Basic ${basicAuth}`;
        this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }

    getToken = () => this.api.post('/tokens', {
        "name" : "token read write",
        "permissions" : "READ_WRITE",
        "expiry_date" : "2025-05-06"
    })
        .then(r => r.data).catch(err => err)

    getProjects = () => this.api.get('/projects', {params: {size: 100}})
        .then(r => r.data).catch(err => err.message)

    createProject = (name, {description="", label=""} = {}) => {

        return this.api.post('/projects', {
            "_type" : "project",
            name,
            label,
            description
        }).then(r => r.data).catch(err => err)
    }

    getAllTestCaseFolders = () => this.api.get('/test-case-folders', {params: {size: 100}})
        .then(r => r.data).catch(err => err.message)

    getProjectTestCaseFolders = (projectIds) => {
        const ids = projectIds.reduce((acc, val)=> acc.concat(val, ','), "")
        console.log(ids)
        return this.api.get(`/test-case-folders/tree/${ids}`, {params: {size: 100}})
            .then(r => r.data).catch(err => err.message)
    }

    createCaseFolder = (name, parentId, {description="", parentType='project', customFields}={}) => {
        const payload = {
            "_type" : "test-case-folder",
            name,
            description : description,
            custom_fields: customFields,
            "parent" : {
                "_type" : parentType,
                "id" : parentId
            }
        }
        return this.api.post('/test-case-folders', payload).then(r => r.data).catch(err => err.message)
    }

    createTestCase = (name, parentId, {description="", parentType=this.objectTypeEnum.testCaseFolder}={}) => {
        const payload = {
            "_type" : "test-case",
            name,
            parent : {
                "_type" : parentType,
                "id" : parentId
            },
            "importance" : "MEDIUM",
            "status" : "APPROVED",
            description,
            "steps" : [
            {
                "_type" : "action-step",
                "action" : "",
                "expected_result" : "",
            } ]
        }
        return this.api.post('/test-cases', payload).then(r => r.data).catch(err => err.message)
    }
}
