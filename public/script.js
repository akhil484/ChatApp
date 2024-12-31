let socket;
let username;
let currentRoom;


const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const wsUrl = window.location.hostname === 'localhost' 
  ? 'ws://localhost:8080'
  : `wss://${window.location.host}`;
function createConnection()
{
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
        const message = document.createElement('div');
        data = JSON.parse(event.data);
        if(data.type === 'room_joined')
        {
            message.id = "joined_msg";
            message.textContent = data.message;
        }
        else if(data.type === 'room_created')
        {
            message.id = "joined_msg";
            message.textContent = 'Welcome';
        }
    
        else
        {
            
            if(data.who=="self")
            {   
                message.id = "self_msg";
                const newSpan = document.createElement("span");
                newSpan.id = "uniqueName";
                newSpan.textContent = 'You';
                
                
                message.appendChild(newSpan);
                
                
                const lineBreak = document.createElement('br');
                message.appendChild(lineBreak);
                const lineBreak2 = document.createElement('br');
                message.appendChild(lineBreak2);
                
                message.appendChild(document.createTextNode(data.content));
                
            }
            else{
                message.id = "other_msg";
            
                const newSpan = document.createElement("span");
                newSpan.id = "uniqueName";
                newSpan.textContent = data.sender;
                message.appendChild(newSpan);
                
                
                const lineBreak = document.createElement('br');
                message.appendChild(lineBreak);
                const lineBreak2 = document.createElement('br');
                message.appendChild(lineBreak2);
                
                message.appendChild(document.createTextNode(data.content));
            }
            
    
            
        }
        
        messagesDiv.appendChild(message);
    };
    
}


sendButton.addEventListener('click', () => {
    const input_msg = messageInput.value;
    if (input_msg) {

        socket.send(JSON.stringify({
            type: 'message',
            roomId: currentRoom,
            message: input_msg,
            sender: username
        }));
        messageInput.value = '';

    }
});


messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

function showChat()
{
    document.getElementById("chat_screen").style.display = 'block';
    document.getElementById("first_step").style.display = 'none';
    document.getElementById("room").textContent = currentRoom;
}


function createRoom()
{
    username = document.getElementById("username").value;
    currentRoom = document.getElementById("room_id").value;
    
    if(!username || !currentRoom)
    {
        alert("Please enter values in both fields");
        return;
    }
    createConnection();
    socket.onopen = () =>{
        socket.send(JSON.stringify({
            type: 'create_room',
            roomId: currentRoom
        }));
    }
    showChat();
}

function joinRoom()
{
    username = document.getElementById("username").value;
    currentRoom = document.getElementById("room_id").value;
    
    if(!username || !currentRoom)
    {
        alert("Please enter values in both fields");
        return;
    }
    createConnection();
    socket.onopen = () =>{
        socket.send(JSON.stringify({
            type: 'join_room',
            roomId: currentRoom,
            sender: username
        }));
    }
    showChat();
}



