import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

type UserInfo = {
    username: string;
    email: string;
    password: string;
}

type FormValidationError = {
    username_error?: string
    email_error?: string
    password_error?: string
}

function Register() {
    const [registrationInfo, setRegistrationInfo] = useState<UserInfo>({
        username: "",
        email: "",
        password: ""
    })
    const [error, setError] = useState<FormValidationError>({})
    const navigate = useNavigate()

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        const userDetails = {
            ...registrationInfo,
            [name]: value
        }

        setRegistrationInfo(userDetails)

        validateForm(userDetails);
    }

    const validateForm = (data: UserInfo): void => {
        const formErrors: FormValidationError = {}

        if (!data.username) {
            formErrors.username_error = "Username is Required"
        }
        if (!data.email) {
            formErrors.email_error = "Email is Required"
        }
        if (!data.password) {
            formErrors.password_error = "Password is Required"
        } else if (data.password.length < 4) {
            formErrors.password_error = "Password length must be greater than 4"
        }
        setError(formErrors)
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (Object.keys(error).length > 0) {
            console.log(error)
        } else {
            try {
                const url = "http://localhost:3002/api/auth/register"
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(registrationInfo)
                })
                const result = await response.json()
                console.log(result)
                setTimeout(() => {
                    navigate('/login')
                }, 1500);
            } catch (error) {
                console.log(error)
            }
        }
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "rgb(30 88 220)"
        }}
            className='register-container'
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
                className='form-container'>
                <form style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "50vh",
                    width: "300px",
                    border: "5px solid green",
                    padding: "10px",
                    margin: "20px",
                    backgroundColor: "white",
                    outline: "5px solid blue",
                    borderRadius: "5px"
                }}
                    onSubmit={handleSubmit}>
                    <label htmlFor="username">
                        <input style={{
                            padding: "10px",
                            fontSize: "15px",
                            border: "3px solid black",
                            borderRadius: "5px",
                            margin: "6px"
                        }}
                            type="text"
                            onChange={handleInput}
                            name="username"
                            id="username"
                            autoFocus
                            placeholder='Enter username'
                            value={registrationInfo.username}
                        />
                    </label>
                    <label htmlFor="email">
                        <input style={{
                            padding: "10px",
                            fontSize: "15px",
                            border: "3px solid black",
                            borderRadius: "5px",
                            margin: "6px"
                        }}
                            type="text"
                            onChange={handleInput}
                            name="email"
                            id="email"
                            placeholder='Enter your email'
                            value={registrationInfo.email}
                        />
                    </label>
                    <label htmlFor="password">
                        <input style={{
                            padding: "10px",
                            fontSize: "15px",
                            border: "3px solid black",
                            borderRadius: "5px",
                            margin: "6px"
                        }}
                            type="password"
                            onChange={handleInput}
                            name="password"
                            id="password"
                            autoFocus
                            placeholder='Enter password'
                            value={registrationInfo.password}
                        />
                    </label>
                    <button style={{
                        padding: "10px",
                        fontSize: "15px",
                        border: "3px solid black",
                        borderRadius: "5px",
                        margin: "6px"
                    }}
                        type="submit">Register</button>
                    <span style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: "10px",
                        fontSize: "18px",
                        margin: "6px",
                        textDecoration: "underline",
                    }}
                    >
                        Already have an Account ?
                        <Link to={'/login'}>Login</Link>
                    </span>
                </form>
            </div>
        </div>
    )
}

export default Register