import { Music2 } from 'lucide-react';

export default function ComposerMusicPreview(){

    return(

        <div
            className="
            rounded-xl
            bg-zinc-900
            border
            border-zinc-800
            p-4
            flex
            gap-4
            "
        >

            <div className="w-16 h-16 rounded-lg bg-zinc-800"/>

            <div className="flex-1">

                <div className="flex items-center gap-2 mb-1">

                    <Music2
                        size={14}
                        className="text-red-400"
                    />

                    <span className="text-xs text-red-400">
                        Compartilhando música
                    </span>

                </div>

                <h4 className="font-semibold">
                    Nome da música
                </h4>

                <p className="text-sm text-zinc-500">
                    Artista
                </p>

            </div>

        </div>

    )

}