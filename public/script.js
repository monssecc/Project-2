let readyStatus = document.querySelector('#readyStatus')
let notReadyStatus = document.querySelector('#notReadyStatus')
let myForm = document.querySelector('#myForm')
let contentArea = document.querySelector('#content')

// listen for form submissions  
myForm.addEventListener('submit', event => {
    // prevent the page from reloading when the form is submitted.
    event.preventDefault();
    // if the user clicked "reset", reset the form
    if (event.submitter.className == "reset") {
        myForm.reset()
    }
    // otherwise assume we need to save the data.
    else {

        // if textarea.validity is false, alert the user and stop processing.
        if (!myForm.description.checkValidity()) {
            alert('Please provide a description of at least 20 characters.')
            return
        }

        // Represent the FormData entries as a JSON object
        // This gives a baseline representation with all values as strings
        const formData = new FormData(myForm)
        const json = Object.fromEntries(formData)

        // Now let's improve the data by handling checkboxes dates, and numbers 
        // more explicitly to prepare the data for storage  
        event.target
            .querySelectorAll('input')
            .forEach(el => {
                // Represent checkboxes as a Boolean value (true/false) 
                // NOTE: By default, unchecked checkboxes are excluded 
                if (el.type == 'checkbox') {
                    json[el.name] = el.checked ? true : false
                }
                // Represent number and range inputs as actual numbers
                else if (el.type == 'number' || el.type == 'range') {
                    if (json[el.name] && json[el.name].trim() !== '') {
                        json[el.name] = Number(json[el.name])
                    }
                    else {
                        json[el.name] = null
                    }
                }
                // Represent all date inputs in ISO-8601 DateTime format
                // NOTE: this makes the date compatible for storage 
                else if (el.type == 'date') {
                    if (json[el.name] && json[el.name].trim() !== '') {
                        json[el.name] = new Date(json[el.name]).toISOString()
                    }
                    else {
                        json[el.name] = null
                    }
                }
            })


        console.log(json)
        // pass the json along to be saved.
        createItem(json)
    }
})


// Given some JSON data, send the data to the API
// NOTE: "async" makes it possible to use "await" 
// See also: https://mdn.io/Statements/async_function
const createItem = async (myData) => {
    // The save operation is nested in a Try/Catch statement
    // See also: https://mdn.io/Statements/try...catch
    try {
        // Let's send the data to the /item endpoint
        // we'll add the data to the body of the request. 
        // https://mdn.io/Fetch_API/Using_Fetch#body

        // We will use the POST method to signal that we want to create a new item
        // Let's also add headers to tell the server we're sending JSON
        // The data is sent in serialized form (via JSON.stringify) 

        const response = await fetch('/data', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(myData)
        })
        // Check if the response status is OK 
        if (!response.ok) {
            try {
                console.error(await response.json())
            }
            catch (err) {
                console.error(response.statusText)
            }
            throw new Error(response.statusText)
        }
        // If all goes well we will recieve back the submitted data
        // along with a new _id field added by MongoDB
        const result = await response.json()
        alert('Data Sent to MongoDB via API. Details are in the console. To see all persisted data, visit the /data endpoint in another tab.');
        // log the result 
        console.log(result)
        // refresh the data list
        getData()
    }
    catch (err) {
        // Log any errors
        console.error(err)
    }
} // end of save function


// fetch items from API endpoint and populate the content div
const getData = async () => {
    const response = await fetch('/data')
    if (response.ok) {
        readyStatus.style.display = 'block'
        const data = await response.json()
        console.log(data)
        if (data.length == 0) {
            contentArea.innerHTML += '<p><i>No data found in the database.</i></p>'
            return
        }
        else {
            contentArea.innerHTML = '<h2>🐈 Noteworthy Cats</h2>'
            data.forEach(item => {
                let div = document.createElement('div')
                div.innerHTML = `<h3>${item.name}</h3>
            <p>${item.microchip || '<i>No Microchip Found</i>'}</p>
            <p>${item.description || '<i>No Description Found</i>'}</p>
            `
                contentArea.appendChild(div)
            })
        }

    }
    else {

        notReadyStatus.style.display = 'block'

    }

}

getData()
