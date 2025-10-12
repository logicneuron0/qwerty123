import { NextResponse } from 'next/server';

// This is a proxy API that forwards requests to the Flask backend
export async function POST(request) {
  try {
    const requestData = await request.json();
    
    if (!requestData.question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Forward the request to the Flask backend
    const response = await fetch('http://localhost:5000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Flask backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error connecting to Flask backend:", error);
    return NextResponse.json({ 
      error: "Failed to connect to the Flask backend. Make sure the Flask server is running on http://localhost:5000",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}