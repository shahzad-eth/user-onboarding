import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

type UserInfo = {
    email: string;
    password: string;
}

type FormValidationError = {
    email_error?: string
    password_error?: string
}

function Login() {
    const [loginInfo, setLoginInfo] = useState<UserInfo>({
        email: "",
        password: ""
    })
    const [error, setError] = useState<FormValidationError>({})
    const navigate = useNavigate()

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        const userDetails = {
            ...loginInfo,
            [name]: value
        }

        setLoginInfo(userDetails)

        validateForm(userDetails);
    }

    const validateForm = (data: UserInfo): void => {
        const formErrors: FormValidationError = {}

        if (!data.email) {
            formErrors.email_error = "Email is Required"
        }
        else if (!data.password) {
            formErrors.password_error = "Password is Required"
        }
        setError(formErrors)
    }

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (Object.keys(error).length > 0) {
            console.log(error)
        } else {
            try {
                const url = "http://localhost:3002/api/auth/login"
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(loginInfo)
                })
                const result = await response.json()
                console.log(result)
                setTimeout(() => {
                    navigate('/')
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
            className='login-container'
        >
            <div className="form-container"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <form
                    style={{
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
                    <label htmlFor="email">
                        <input type="text"
                            style={{
                                padding: "10px",
                                fontSize: "15px",
                                border: "3px solid black",
                                borderRadius: "5px",
                                margin: "6px"
                            }}
                            onChange={handleInput}
                            name="email"
                            id="email"
                            placeholder='Enter your email'
                            value={loginInfo.email}
                        />
                    </label>
                    <label htmlFor="password">
                        <input type="password"
                            style={{
                                padding: "10px",
                                fontSize: "15px",
                                border: "3px solid black",
                                borderRadius: "5px",
                                margin: "6px"
                            }}
                            onChange={handleInput}
                            name="password"
                            id="password"
                            autoFocus
                            placeholder='Enter password'
                            value={loginInfo.password}
                        />
                    </label>
                    <button
                        type="submit"
                        style={{
                            padding: "10px",
                            fontSize: "15px",
                            border: "3px solid black",
                            borderRadius: "5px",
                            margin: "6px"
                        }}
                    >Register</button>
                    <span
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "10px",
                            fontSize: "18px",
                            margin: "6px",
                            textDecoration: "underline",
                        }}
                    >
                        Don't have an Account ?<br />
                        <Link
                            style={{
                                padding: "10px",
                                fontSize: "25px",
                                margin: "6px",
                                textAlign: "center"
                            }}
                            to={'/auth/register'}> Register</Link>
                    </span>
                </form>
            </div>
        </div>
    )
}

export default Login