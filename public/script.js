let readyStatus = document.querySelector('#readyStatus')
let notReadyStatus = document.querySelector('#notReadyStatus')
let myForm = document.querySelector('#myForm')
let contentArea = document.querySelector('#content')

// Listen for form submissions  
myForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    console.log('Form submitted')

    // If the user clicked "reset", reset the form
    if (event.submitter.className == "reset") {
        myForm.reset()
        delete myForm.dataset.editId
        const saveButton = myForm.querySelector('button.save')
        if (saveButton) saveButton.textContent = 'Save'
        return
    }

    // Check if we're editing or creating
    const editId = myForm.dataset.editId

    // Represent the FormData entries as a JSON object
    const formData = new FormData(myForm)
    const json = Object.fromEntries(formData)

    // Handle checkboxes, numbers, and dates
    event.target.querySelectorAll('input').forEach(el => {
        if (el.type == 'checkbox') {
            json[el.name] = el.checked ? true : false
        }
        else if (el.type == 'number' || el.type == 'range') {
            if (json[el.name] && json[el.name].trim() !== '') {
                json[el.name] = Number(json[el.name])
            } else {
                json[el.name] = null
            }
        }
        else if (el.type == 'date') {
            if (json[el.name] && json[el.name].trim() !== '') {
                json[el.name] = new Date(json[el.name]).toISOString()
            } else {
                json[el.name] = null
            }
        }
    })

    console.log(json)

    // Save or update the data
    if (editId) {
        await updateItem(editId, json)
    } else {
        await createItem(json)
    }
})

// Create new item
const createItem = async (myData) => {
    try {
        const response = await fetch('/data', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(myData)
        })

        if (!response.ok) {
            const error = await response.json()
            console.error(error)
            throw new Error(error.error || response.statusText)
        }

        const result = await response.json()
        console.log('Created:', result)
        alert('Recipe saved successfully!')

        // Reset form
        myForm.reset()

        // Refresh the data list
        getData()
    }
    catch (err) {
        console.error(err)
        alert('Failed to save recipe: ' + err.message)
    }
}

// Update existing item
const updateItem = async (id, myData) => {
    try {
        const response = await fetch(`/data/${id}`, {
            method: "PUT",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(myData)
        })

        if (!response.ok) {
            const error = await response.json()
            console.error(error)
            throw new Error(error.error || response.statusText)
        }

        const result = await response.json()
        console.log('Updated:', result)
        alert('Recipe updated successfully!')

        // Reset form and edit mode
        myForm.reset()
        delete myForm.dataset.editId

        // Reset button text
        const saveButton = myForm.querySelector('button.save')
        if (saveButton) saveButton.textContent = 'Save'

        // Refresh the data list
        getData()
    }
    catch (err) {
        console.error(err)
        alert('Failed to update recipe: ' + err.message)
    }
}

// Fetch items from API endpoint and populate the content div
const getData = async () => {
    try {
        const response = await fetch('/data')

        if (response.ok) {
            readyStatus.style.display = 'block'
            notReadyStatus.style.display = 'none'

            const data = await response.json()
            console.log(data)

            contentArea.innerHTML = ''

            if (data.length == 0) {
                contentArea.innerHTML = '<p><i>No recipes found in the database.</i></p>'
                return
            }

            data.forEach(item => {
                let div = document.createElement('div')
                div.className = 'profile'
                div.innerHTML = `
                    <h3>${item.name || 'Untitled Recipe'}</h3>
                    <p><strong>Program:</strong> ${item.program || 'N/A'}</p>
                    <p><strong>Year:</strong> ${item.year || 'N/A'}</p>
                    <p><strong>Campus:</strong> ${item.campus || 'N/A'}</p>
                    <p><strong>Bio:</strong> ${item.bio || 'N/A'}</p>
                    <p><strong>Motivation:</strong> ${item.motivation || 'N/A'}</p>
                    <p><strong>Skills You Have:</strong> ${item.skillsYouHave || 'N/A'}</p>
                    <p><strong>Skills You Want:</strong> ${item.skillYouWant || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${item.contact || 'N/A'}</p>
                    <div class="item-actions">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `

                // Add event listeners to buttons
                div.querySelector('.edit-btn').addEventListener('click', () => editItem(item))
                div.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id))

                contentArea.appendChild(div)
            })
        }
        else {
            readyStatus.style.display = 'none'
            notReadyStatus.style.display = 'block'
        }
    }
    catch (error) {
        console.error('Error fetching data:', error)
        notReadyStatus.style.display = 'block'
    }
}

// Edit item - populate form with existing data
const editItem = (data) => {
    console.log('Editing:', data)

    // Store the ID we're editing
    myForm.dataset.editId = data.id

    // Populate the form with data to be edited
    Object.keys(data).forEach(field => {
        const element = myForm.elements[field]
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = data[field]
            } else if (element.type === 'date') {
                // Extract yyyy-mm-dd from ISO date string
                element.value = data[field] ? data[field].substring(0, 10) : ''
            } else {
                element.value = data[field] || ''
            }
        }
    })

    // Change button text to indicate edit mode
    const saveButton = myForm.querySelector('button.save')
    if (saveButton) saveButton.textContent = 'Update Recipe'

    // Scroll to form
    myForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Delete item
const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return
    }

    try {
        const response = await fetch(`/data/${id}`, {
            method: "DELETE"
        })

        if (response.ok) {
            const result = await response.json()
            console.log('Deleted:', result)
            alert('Recipe deleted successfully!')
            // Refresh the data list
            getData()
        }
        else {
            const errorData = await response.json()
            alert(errorData.error || 'Failed to delete recipe')
        }
    } catch (error) {
        console.error('Delete error:', error)
        alert('An error occurred while deleting')
    }
}

// Load data when page loads
getData()
