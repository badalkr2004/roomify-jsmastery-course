import {useParams} from "react-router";


export default function Visualizer() {
    const { id } = useParams();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">
                Room Visualizer
            </h1>

            <p className="text-gray-500">
                Session ID: {id}
            </p>

            {/* Canvas / WebGL / Layout editor here */}
        </div>
    );
}
