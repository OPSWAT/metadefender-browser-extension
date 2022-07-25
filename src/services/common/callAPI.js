/**
 * Call core api and handle http response and errors.
 * 
 * @param {string} endpoint endpoint URL
 * @param {*} options http options
 * @param {string} verb request type: 'get' | 'post' 
 * @returns {Promise}
 */
export function callAPI(endpoint, options, verb = 'get') {
    return fetch(
        endpoint,
        { ...options, method: verb.toUpperCase() }
    ).then(data => data.json());
}