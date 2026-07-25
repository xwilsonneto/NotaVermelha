import { Music2 } from 'lucide-react';

export default function ComposerMusicPreview(){

    return(

        <div
            className="
            rounded-lg md:rounded-xl
            bg-zinc-900
            border
            border-zinc-800
            p-3 md:p-4
            flex
            gap-3 md:gap-4
            "
        >

            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-zinc-800 shrink-0"/>

            <div className="flex-1 min-w-0">

                <div className="flex items-center gap-2 mb-1">

                    <Music2
                        size={13}
                        className="md:w-[14px] md:h-[14px] text-red-400"
                    />

                    <span className="text-xs text-red-400">
                        Compartilhando música
                    </span>

                </div>

                <h4 className="font-semibold text-sm md:text-base truncate">
                    Nome da música
                </h4>

                <p className="text-xs md:text-sm text-zinc-500">
                    Artista
                </p>

            </div>

        </div>

    )

}