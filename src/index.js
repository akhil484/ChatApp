import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';

import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const wss = new WebSocketServer({ port : 8080 });
const rooms = new Map();

class TrieNode
{
    constructor()
    {
        this.children = new Map();
        this.isEndOfWord = false;
    }
    
}

class WordFilter
{
    constructor()
    {
        this.root = new TrieNode();
    }

    insertWord(word)
    {
        let current = this.root;
        const cleanWord = word.toLowerCase();
        for(let char of cleanWord)
        {
            if(!current.children.has(char))
            {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char);

        }
        current.isEndOfWord = true;
    }

    isAbusiveWord(word)
    {
        let current = this.root;
        const cleanWord = word.toLowerCase();
        for(let char of cleanWord)
        {
            if(!current.children.has(char))
            {
                return false;
            }
            current = current.children.get(char);

        }
        return current.isEndOfWord;   
    }
}

const wordFilter = new WordFilter(); 

function initializeWordFilter() {
    const abusiveWords = ['shit', 'fuck', 'fucker'];
    abusiveWords.forEach(word => wordFilter.insertWord(word));
}

function mask_this_word(word)
{
    let new_word = word[0];
    for (let i = 1; i < word.length; i++)
    {
        new_word += "*";
    }
    return new_word;
}

function check_for_abuses(message)
{
    let words = message.split(" ");
    let new_message = "";
    for(let i = 0;i<words.length;i++)
    {
        if(wordFilter.isAbusiveWord(words[i]))
        {
            let masked_word = mask_this_word(words[i]);
            if(new_message === "")
                new_message = masked_word;
            else
            {
                new_message = new_message + " " + masked_word;
            }
        }
        else
        {
            if(new_message === "")
                new_message = words[i];
            else
            {
                new_message = new_message + " " + words[i];
            }
        }
    }
    
    return new_message;
}

initializeWordFilter();


app.use(express.static(path.join(__dirname, '../public')));


app.get('/chat', (req, res) => {
    // Ensure the absolute path to chat.html
    const filePath = path.join(__dirname, '../public/chat.html');
    res.sendFile(filePath);
});


 wss.on("connection", function(socket){
    let currentRoom = null;


    socket.on('message', (message) => {
        const data = JSON.parse(message);
        
        if(data.type == 'create_room')
        {
            const roomid = data.roomId;
            
            if(!rooms.has(roomid))
            {
                rooms.set(roomid,[socket]);
            }
            currentRoom = roomid;
            socket.send(JSON.stringify({
                type: 'room_created',
                roomId: roomid
              }));
        }

        else if(data.type == 'join_room')
        {
            const roomid = data.roomId;
            const sender_name = data.sender
            if(rooms.has(roomid))
            {
                rooms.get(roomid).push(socket);
                currentRoom = roomid;
                rooms.get(currentRoom).forEach((client)=>{
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'room_joined',
                            roomId: roomid,
                            message:`${sender_name} has joined the chat`
                        }));
                    }
                })
            }
            
        }

        else
        {
            if(currentRoom && rooms.has(currentRoom))
            {
                let message_after_masking = check_for_abuses(data.message)
                rooms.get(currentRoom).forEach((client)=>{
                    if (client!=socket && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'message',
                            content: message_after_masking,
                            sender: data.sender
                        }));
                    }
                })
            }
            
        }
        
    });
 })

 app.listen(3000);