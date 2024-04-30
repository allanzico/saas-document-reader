import { ChangeEvent, ReactNode, createContext, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useMutation } from "@tanstack/react-query";
type StreamResponse = {
    addMessage: () => void,
    message: string,
    handleInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void,
    isLoading: boolean,
}
export const ChatContext = createContext <StreamResponse>({
    addMessage: () => {},
    message: '',
    handleInputChange: () => {},
    isLoading: false,
});

interface ChatContextProviderProps {
    fileId: string,
    children: ReactNode,

}

export const ChatContextProvider = ({fileId, children}: ChatContextProviderProps) => {
    const [message, setMessage] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const {toast} = useToast()

    const {mutate: sendMessage} = useMutation({
        mutationFn: async ({message}:{message: string}) => {
            const response = await fetch(`/api/message/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    fileId,
                }),

                
            })

            if(!response.ok) {throw new Error('Failed to send message')}

            return response.body
        },
    })
const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)
    const addMessage = () => sendMessage({message})

    return (
        <ChatContext.Provider value={{
            addMessage,
            message,
            handleInputChange,
            isLoading,
        }}>
            {children}
        </ChatContext.Provider>
    )
}