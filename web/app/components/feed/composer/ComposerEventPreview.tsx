import { Calendar } from 'lucide-react';

export default function ComposerEventPreview(){

    return(

        <div
            className="
            rounded-lg md:rounded-xl
            border
            border-zinc-800
            bg-zinc-900
            p-3 md:p-4
            "
        >

            <div className="flex items-center gap-2 text-red-400 mb-2">

                <Calendar size={14} className="md:w-[15px] md:h-[15px]"/>

                <span className="text-xs">
                    Evento
                </span>

            </div>

            <h3 className="font-semibold text-sm md:text-base">
                Festival de Rock
            </h3>

            <p className="text-xs md:text-sm text-zinc-500">
                24 de Novembro • São Paulo
            </p>

        </div>

    )

}