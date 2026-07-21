import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

type ILoggedInUser = {
    id: number; // | null
    username: string; // | null
    email: string; // | null
    createdAt: Date; // | null
}

function Home() {
    const [loggedInUser, setLoggedInUser] = useState<ILoggedInUser | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const baseUrl: string = "http://localhost:3002/api";
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUserByToken = async () => {
            try {
                console.log("Entering function")
                setLoading(true)
                console.log("Loading true..")
                const url: string = `${baseUrl}/user/profile`;
                const response = await fetch(url, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                })
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)
                console.log("response success")
                const result = await response.json();
                setLoggedInUser(result)
                console.log(result)
                setLoading(false)
            } catch (error) {
                console.log("loading false")
                setLoading(false)
                console.error("Login failed : ", error)
                setTimeout(() => {
                    console.log("navigating to login page...")
                    navigate('/login')
                }, 1500);
            }
        }
        fetchUserByToken()
    }, [])
    return (
        <div>
            {loading ? (
                <div>
                    <h2>Loading please wait...</h2>
                </div>
            ) : (
                <div>
                    {!loading && loggedInUser ? (
                        <div>
                            <h2>Username : {loggedInUser.username}</h2>
                            <h2>Email : {loggedInUser.email}</h2>
                            <h2>User Id : {loggedInUser.id}</h2>
                        </div>
                    ) : (
                        <div>
                            <h2>Login failed redirecting to Login page...</h2>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Home