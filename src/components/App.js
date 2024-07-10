import React, { useState } from 'react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

const initialMessages = [
  {
    message: "Hello, I am ChatGPT! I can help you decide on the best surgery, location, and doctor. Let's get started!",
    sender: 'ChatGPT',
  },
  { message: 'What type of surgery are you considering?', sender: 'ChatGPT' },
];

const locations = ['Atlanta', 'Chicago', 'Phoenix', 'Baltimore', 'Tampa', 'Miami', 'New York', 'Las Vegas'];

const questions = [
  'What type of surgery are you considering?',
  `Which location do you prefer? Here are some options: ${locations.join(', ')}.`,
  'Are you looking for specific qualifications in a doctor?',
  'Do you have any other preferences or requirements?',
];

const App = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const handleUserMessage = async (userMessage) => {
    const newMessage = { message: userMessage, sender: 'user' };
    setMessages([...messages, newMessage]);
    setIsTyping(true);
    await processUserMessage([...messages, newMessage], questionIndex);
  };

  const processUserMessage = async (chatMessages, index) => {
    const apiMessages = chatMessages.map((msg) => ({
      role: msg.sender === 'ChatGPT' ? 'assistant' : 'user',
      content: msg.message,
    }));
    const systemMessage = {
      role: 'system',
      content: 'You are a helpful assistant guiding a patient through the decision-making process for surgery.',
    };
    const body = {
      model: 'gpt-4-turbo',
      messages: [systemMessage, ...apiMessages],
      max_tokens: 150,
      temperature: 0.7,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let botMessageContent = '';
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        botMessageContent = data.choices[0].message.content;
      } else {
        console.error('Unexpected API response format:', data);
      }

      if (index < questions.length - 1) {
        botMessageContent += ` ${questions[index + 1]}`;
        setQuestionIndex(index + 1);
      } else {
        botMessageContent += ' Thank you for providing the details. Here is the recommendation based on your inputs.';
        // Here you can add logic to generate a recommendation based on the user's answers.
      }

      const botMessage = { message: botMessageContent, sender: 'ChatGPT' };
      setMessages([...chatMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '90vh', maxWidth: '700px', margin: '0 auto' }}>
      <MainContainer>
        <ChatContainer>
          <MessageList typingIndicator={isTyping ? <TypingIndicator content='ChatGPT is typing' /> : null}>
            {messages.map((msg, i) => (
              <Message key={i} model={{ message: msg.message, sender: msg.sender }} />
            ))}
          </MessageList>
          <MessageInput placeholder='Type message here' onSend={handleUserMessage} />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default App;
