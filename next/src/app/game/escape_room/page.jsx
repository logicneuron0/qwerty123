"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Game from '@/components/Game';

const EscapeRoom = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setIsAuthenticated(true);
      } else {
        // Redirect to login if not authenticated
        router.push('api/auth/login?redirect=/game/escape_room');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('api/auth/login?redirect=/game/escape_room');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main>
      <Game userData={userData} />
    </main>
  );
};

export default EscapeRoom;