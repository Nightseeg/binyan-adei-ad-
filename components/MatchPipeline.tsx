import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Match, MatchStatus, Profile, Gender } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProps } from '@hello-pangea/dnd';
import { MoreHorizontal, Clock, MessageCircle, Heart, Trash2, RefreshCcw, Kanban } from 'lucide-react';

interface MatchPipelineProps {
    matches: Match[];
    profiles: Profile[];
    onUpdateStatus: (matchId: string, newStatus: MatchStatus) => void;
    onDeleteMatch: (matchId: string) => void;
    onViewProfile: (profile: Profile) => void;
}

// Fix for React Strict Mode
const StrictModeDroppable = ({ children, ...props }: any) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) {
        return null;
    }

    return <Droppable {...props}>{children}</Droppable>;
};

const MatchPipeline: React.FC<MatchPipelineProps> = ({ matches, profiles, onUpdateStatus, onDeleteMatch, onViewProfile }) => {


    const matchColumns = [
        { id: MatchStatus.RESEARCHING, title: 'À proposer', color: 'bg-wedding-navy/10 border-wedding-navy/5 text-wedding-navy' },
        { id: MatchStatus.SUGGESTED, title: 'En Birourim', color: 'bg-wedding-gold/10 border-wedding-gold/20 text-wedding-navy' },
        { id: MatchStatus.DATING, title: 'Rencontres', color: 'bg-wedding-gold/20 border-wedding-gold/30 text-wedding-navy' },
        { id: MatchStatus.ENGAGED, title: 'Fiancés', color: 'bg-wedding-gold/30 border-wedding-gold/40 text-wedding-navy' }
    ];



    const getProfile = (id: string) => profiles.find(p => p.id === id);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        onUpdateStatus(draggableId, destination.droppableId as MatchStatus);
    };

    return (
        <div className="h-full flex flex-col pt-4">


            <div className="flex-1 overflow-x-auto custom-scrollbar-h p-8">
                {/* @ts-ignore */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-8 min-w-max mx-auto justify-center">
                        {matchColumns.map(column => {
                            const columnMatches = matches.filter(m => m.status === column.id);

                            return (
                                <div key={column.id} className="w-[380px] flex flex-col glass-card border-none shadow-2xl shadow-wedding-navy/10 max-h-full overflow-hidden shrink-0 group/col relative">
                                    {/* Column Header */}
                                    <div className={`p-6 flex flex-col relative z-20 bg-white/50 backdrop-blur-md`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-serif font-bold text-xl text-wedding-navy tracking-tight">{column.title}</h3>
                                            <span className="text-[10px] bg-wedding-navy/5 text-wedding-navy px-2.5 py-1 rounded-lg font-bold">
                                                {columnMatches.length}
                                            </span>
                                        </div>
                                        <div className={`h-1 w-full rounded-full mt-3 bg-gradient-to-r ${column.id === MatchStatus.ENGAGED ? 'from-wedding-gold via-wedding-gold/50 to-transparent' :
                                            column.id === MatchStatus.DATING ? 'from-pink-400 via-pink-300 to-transparent' :
                                                column.id === MatchStatus.SUGGESTED ? 'from-blue-400 via-blue-300 to-transparent' :
                                                    'from-wedding-navy via-wedding-navy/50 to-transparent'
                                            }`} />
                                    </div>

                                    <StrictModeDroppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 p-5 space-y-5 overflow-y-auto custom-scrollbar transition-colors duration-500 bg-gradient-to-b from-white/50 to-transparent ${snapshot.isDraggingOver ? 'bg-wedding-navy/[0.02]' : ''}`}
                                            >
                                                {columnMatches.map((match, index) => {
                                                    const boy = getProfile(match.boyId);
                                                    const girl = getProfile(match.girlId);

                                                    if (!boy || !girl) return null;

                                                    return (
                                                        // @ts-ignore - dnd type compatibility
                                                        <Draggable key={match.id} draggableId={match.id} index={index}>
                                                            {(provided, snapshot) => {
                                                                const content = (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            zIndex: snapshot.isDragging ? 9999 : 1
                                                                        }}
                                                                        className={`relative p-6 rounded-2xl border group ${snapshot.isDragging
                                                                            ? 'shadow-2xl bg-white border-wedding-gold ring-2 ring-wedding-gold/20 scale-105'
                                                                            : 'bg-white border-wedding-navy/5 shadow-sm hover:border-wedding-gold/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300'
                                                                            }`}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-6">
                                                                            <div className="flex items-center -space-x-4">
                                                                                <img
                                                                                    src={boy.imageUrl || `https://ui-avatars.com/api/?name=${boy.firstName}&background=0A192F&color=fff`}
                                                                                    alt={boy.firstName}
                                                                                    className="w-14 h-14 rounded-full border-[3px] border-white object-cover shadow-lg hover:z-10 transition-all hover:scale-110 cursor-pointer"
                                                                                    title={`Voir le profil de ${boy.firstName}`}
                                                                                    onClick={() => onViewProfile(boy)}
                                                                                />
                                                                                <img
                                                                                    src={girl.imageUrl || `https://ui-avatars.com/api/?name=${girl.firstName}&background=D4AF37&color=fff`}
                                                                                    alt={girl.firstName}
                                                                                    className="w-14 h-14 rounded-full border-[3px] border-white object-cover shadow-lg hover:z-10 transition-all hover:scale-110 cursor-pointer"
                                                                                    title={`Voir le profil de ${girl.firstName}`}
                                                                                    onClick={() => onViewProfile(girl)}
                                                                                />
                                                                            </div>

                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-wedding-navy/5 p-1 flex gap-1">
                                                                                {match.status !== MatchStatus.ARCHIVED ? (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (window.confirm('Voulez-vous vraiment supprimer ce match DÉFINITIVEMENT ?')) {
                                                                                                onDeleteMatch(match.id);
                                                                                            }
                                                                                        }}
                                                                                        className="p-1.5 hover:bg-red-50 text-wedding-navy/40 hover:text-red-500 rounded-md transition-colors"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        onClick={() => onUpdateStatus(match.id, MatchStatus.RESEARCHING)}
                                                                                        className="p-1.5 hover:bg-green-50 text-wedding-navy/40 hover:text-green-500 rounded-md transition-colors"
                                                                                    >
                                                                                        <RefreshCcw className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-center mb-6">
                                                                            <div className="text-xl font-serif font-bold text-wedding-navy mb-1 group-hover:text-wedding-gold transition-colors">
                                                                                {boy.firstName} & {girl.firstName}
                                                                            </div>
                                                                            <div className="text-[10px] text-wedding-text/40 font-bold uppercase tracking-[0.2em]">
                                                                                {boy.lastName} • {girl.lastName}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between pt-4 border-t border-dashed border-wedding-navy/10">
                                                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-wedding-text/40 uppercase tracking-widest">
                                                                                <Clock className="w-3 h-3 text-wedding-gold" />
                                                                                <span>{new Date(match.lastUpdated).toLocaleDateString()}</span>
                                                                            </div>
                                                                            <div className="flex -space-x-2">
                                                                                {/* Indicators could go here */}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );

                                                                if (snapshot.isDragging) {
                                                                    const portalElement = document.getElementById('pipeline-portal') || document.body;
                                                                    return ReactDOM.createPortal(content, portalElement);
                                                                }

                                                                return content;
                                                            }}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </StrictModeDroppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
};

export default MatchPipeline;
