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
        <div className='register-container'>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">
                    <input type="text"
                        onChange={handleInput}
                        name="username"
                        id="username"
                        autoFocus
                        placeholder='Enter username'
                        value={registrationInfo.username}
                    />
                </label>
                <label htmlFor="email">
                    <input type="text"
                        onChange={handleInput}
                        name="email"
                        id="email"
                        placeholder='Enter your email'
                        value={registrationInfo.email}
                    />
                </label>
                <label htmlFor="password">
                    <input type="password"
                        onChange={handleInput}
                        name="password"
                        id="password"
                        autoFocus
                        placeholder='Enter password'
                        value={registrationInfo.password}
                    />
                </label>
                <button type="submit">Register</button>
                <span>
                    Already have an Account ?
                    <Link to={'/auth/login'}>Login</Link>
                </span>
            </form>
        </div>
    )
}

export default Register