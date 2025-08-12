import { NextResponse } from "next/server";
export async function POST(request: Request){
    const {provider, parent_folder, search, sort_on, limit, offset, content_search} = await request.json();
    const accessToken = request.headers.get("access_token");

    if(!accessToken){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/files`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        },
        method: "POST",
        body: JSON.stringify({
            provider,
            parent_folder,
            search,
            sort_on,
            limit,
            offset,
            content_search
        })
    })

    const data = await response.json();
    console.log(data);
    return NextResponse.json(data, { status: response.status });
}