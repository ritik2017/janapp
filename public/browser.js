const config = {
    headers: {
        'content-type': "application/json"
    }
}

let skip = 0;

document.addEventListener('click', function(event) {
    
    if(event.target.classList.contains('edit-me')) {
        // console.log("Edit button was clicked");

        let userInput = prompt('Enter your new todo text');

        if(userInput) {
            let body = JSON.stringify({
                id: event.target.getAttribute('data-id'),
                newData: {
                    todo: userInput
                }
            })

            axios.post('/edit-item', body, config).then((res) => {
                if(res.status == 200) {
                    event.target.parentElement.parentElement.querySelector('.item-text').innerHTML = userInput;
                } else {
                    alert('Updation Failed');
                }
            }).catch((err) => {
                alert('Updation failed');
            })
        }
    }

    if(event.target.classList.contains('delete-me')) {

        if(confirm('Do You want to delete the todo')) {
            let body = JSON.stringify({
                id: event.target.getAttribute('data-id')
            })
    
            axios.post('/delete-item', body, config).then((res) => {
                if(res.status == 200) {
                    event.target.parentElement.parentElement.remove();
                }else {
                    alert('Delete Unsuccessful');
                }
            }).catch((err) => {
                alert('Delete Unsuccessful');
            })
        }
    }

    if(event.target.getAttribute('id') == 'show_more') {
        // Call the new api - pagination_dashboard
        axios.post(`/pagination_dashboard?skip=${skip}`, JSON.stringify({}), config)
        .then((res) => {
            
            if(res.status != 200) {
                alert('An error occured. Please try again');
                return;
            }

            const todoItems = res.data.data[0].data;
            // console.log(todoItems);

            document.getElementById("item_list").insertAdjacentHTML('beforeend', todoItems.map((todo) => {
                return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                        <span class="item-text"> ${todo.todo} </span>
                        <div>
                        <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                        <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                        </div>
                    </li>`
            }).join(''));
            
            skip += todoItems.length;

        }).catch(err => {
            alert('Not able to fetch todos. Please try again.')
        }) 
    }

    if(event.target.classList.contains('add_item')) {
        event.preventDefault();

        const todoText = document.getElementById('create_field');

        if(todoText.value === "")
            return;

        axios.post('/create-item', JSON.stringify({
            todo: todoText.value
        }), config).then(res => {
            console.log(res);
            todoText.value = "";
        }).catch(err => {
            alert('Todo creation failed');
        }) 
    }

})

// todosHtml = todos.map((todo) => {
//     return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
//     <span class="item-text"> ${todo.todo} </span>
//     <div>
//       <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
//       <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
//     </div>
//   </li>`
// }).join('')

// document.getElementById('item_list').insertAdjacentHTML('beforeend', todosHtml);

window.onload = function() {
    axios.post(`/pagination_dashboard?skip=${skip}`, JSON.stringify({}), config)
    .then((res) => {
        
        if(res.status != 200) {
            alert('An error occured. Please try again');
            return;
        }

        const todoItems = res.data.data[0].data;
        // console.log(todoItems);

        document.getElementById("item_list").insertAdjacentHTML('beforeend', todoItems.map((todo) => {
            return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                    <span class="item-text"> ${todo.todo} </span>
                    <div>
                    <button data-id="${todo._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                    <button data-id="${todo._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
                    </div>
                </li>`
        }).join(''));
        
        skip += todoItems.length;

    }).catch(err => {
        alert('Not able to fetch todos. Please try again.')
    }) 
}