'use client';

import {
    Image,
    Video,
    Calendar,
    Music2,
    Smile,
    MapPin
} from 'lucide-react';

const buttons = [
    Image,
    Video,
    Music2,
    Calendar,
    MapPin,
    Smile
];

export default function ComposerToolbar() {
    return (
        <div className="flex items-center gap-1">

            {buttons.map((Icon, i) => (

                <button
                    key={i}
                    className="
                    w-10
                    h-10
                    rounded-xl
                    hover:bg-zinc-800
                    transition
                    flex
                    items-center
                    justify-center
                    text-zinc-400
                    hover:text-red-400
                    "
                >
                    <Icon size={18}/>
                </button>

            ))}

        </div>
    );
}