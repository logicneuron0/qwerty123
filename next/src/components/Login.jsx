"use client";
import React, { useEffect, useRef, useState } from 'react';
import styles from './Login.module.css';
import { useRouter } from "next/navigation";

function Login() {
  
  const [showLogin, setShowLogin] = useState(false); // Move state here
  const [showCreepyMsg, setShowCreepyMsg] = useState(false);
  const [creepyText, setCreepyText] = useState("");
  const creepyMsg = "TTouch the lamp. If it flickers, it's not the wind—it's her.";
  const timerRef = useRef();
  const textTimerRef = useRef();

   const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

  useEffect(() => {
    if (!showLogin) {
      timerRef.current = setTimeout(() => setShowCreepyMsg(true), 2000);
    } else {
      setShowCreepyMsg(false);
      setCreepyText("");
    }
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(textTimerRef.current);
    };
  }, [showLogin]);

  useEffect(() => {
    if (showCreepyMsg) {
      setCreepyText("");
      let i = 0;
      function typeLetter() {
        setCreepyText((prev) => (i < creepyMsg.length ? prev + creepyMsg[i] : prev));
        i++;
        if (i < creepyMsg.length) {
          textTimerRef.current = setTimeout(typeLetter, 70 + Math.random() * 80);
        }
      }
      typeLetter();
    } else {
      setCreepyText("");
    }
    return () => clearTimeout(textTimerRef.current);
  }, [showCreepyMsg, creepyMsg]);


    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }
      router.push("/game");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };


  return (
    <div className={`${styles.container}${showLogin ? ` ${styles.active} ${styles.animation}` : ''}`} style={{
      background: showLogin ? undefined : 'black',
      transition: 'background 0.7s',
    }}>
      {!showLogin && (
        <>
          <div className={styles.lamp} onClick={() => setShowLogin(true)}></div>
          {showCreepyMsg && <div className={styles.creepyMsgFlicker}>{creepyText}</div>}
        </>
      )}

      {showLogin && (
        <>
          <div className={styles.leaves}></div>
          <div className={styles.lamp} onClick={() => setShowLogin(false)}></div>
          <div className={styles.loginForm} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ textAlign: 'center', width: '100%'}} className={styles.mainTitle}>Enter the Killa</h2>
            <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Username" 
            className={styles.zoomInput} value={username} onChange={(e)=> setUsername(e.target.value)}
            />
            <input type="password" placeholder="Password" className={styles.zoomInput} 
            value={password} onChange={(e)=> setPassword(e.target.value)}
            />
            <div className='flex w-full flex-1 justify-center align-middle items-center mt-10 '><button className='rounded-full' type='submit'>Login</button></div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default Login;