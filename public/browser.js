const config = {
    headers: {
        'content-type': "application/json"
    }
}

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
})