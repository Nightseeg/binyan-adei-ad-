import React, { useState, useEffect } from 'react';
import { Match, MatchStatus, Profile, Gender } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProps } from '@hello-pangea/dnd';
import { MoreHorizontal, Clock, MessageCircle, Heart, Trash2, Archive, RefreshCcw, Kanban } from 'lucide-react';

interface MatchPipelineProps {
    matches: Match[];
    profiles: Profile[];
    onUpdateStatus: (matchId: string, newStatus: MatchStatus) => void;
}

// Fix for React Strict Mode
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
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

const MatchPipeline: React.FC<MatchPipelineProps> = ({ matches, profiles, onUpdateStatus }) => {
    const [showArchived, setShowArchived] = useState(false);

    const matchColumns = [
        { id: MatchStatus.RESEARCHING, title: 'Recherche', color: 'bg-wedding-navy/10 border-wedding-navy/5 text-wedding-navy' },
        { id: MatchStatus.SUGGESTED, title: 'Suggéré', color: 'bg-wedding-gold/10 border-wedding-gold/20 text-wedding-navy' },
        { id: MatchStatus.DATING, title: 'Rencontres', color: 'bg-wedding-gold/20 border-wedding-gold/30 text-wedding-navy' },
        { id: MatchStatus.ENGAGED, title: 'Fiancés', color: 'bg-wedding-gold/30 border-wedding-gold/40 text-wedding-navy' }
    ];

    if (showArchived) {
        matchColumns.push({ id: MatchStatus.ARCHIVED, title: 'Archivés', color: 'bg-wedding-text/5 border-wedding-text/10 text-wedding-text/60' });
    }

    const getProfile = (id: string) => profiles.find(p => p.id === id);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        onUpdateStatus(draggableId, destination.droppableId as MatchStatus);
    };

    return (
        <div className="h-full flex flex-col pt-4">
            <div className="flex justify-between items-center px-8 mb-4">
                <h2 className="text-2xl font-serif font-bold text-wedding-navy uppercase tracking-luxury flex items-center gap-3">
                    <Kanban className="w-6 h-6 text-wedding-gold" />
                    Pipeline des Matchs
                </h2>
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${showArchived ? 'bg-wedding-navy text-white shadow-lg' : 'bg-wedding-gold/10 text-wedding-navy hover:bg-wedding-gold/20 border border-wedding-gold/20'}`}
                >
                    <Archive className="w-3.5 h-3.5" />
                    {showArchived ? 'Masquer Archives' : 'Voir Archives'}
                </button>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar-h">
                {/* @ts-ignore */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-8 min-w-max px-8 pb-8">
                        {matchColumns.map(column => {
                            const columnMatches = matches.filter(m => m.status === column.id);

                            return (
                                <div key={column.id} className="w-[340px] flex flex-col glass-card border-wedding-navy/5 shadow-2xl shadow-wedding-navy/5 max-h-full overflow-hidden">
                                    <div className={`p-6 border-b border-wedding-navy/5 flex justify-between items-center bg-gradient-to-r from-wedding-navy/5 to-transparent`}>
                                        <h3 className="font-serif font-bold text-lg text-wedding-navy flex items-center gap-2">
                                            {column.title}
                                            <span className="text-[10px] bg-wedding-gold text-wedding-navy px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                {columnMatches.length}
                                            </span>
                                        </h3>
                                    </div>

                                    <StrictModeDroppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 p-5 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-300 ${snapshot.isDraggingOver ? 'bg-wedding-gold/5' : ''}`}
                                            >
                                                {columnMatches.map((match, index) => {
                                                    const boy = getProfile(match.boyId);
                                                    const girl = getProfile(match.girlId);

                                                    if (!boy || !girl) return null;

                                                    return (
                                                        // @ts-ignore - dnd type compatibility
                                                        <Draggable key={match.id} draggableId={match.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`glass-card p-5 rounded-2xl border-white/40 shadow-xl shadow-wedding-navy/5 group hover:border-wedding-gold/50 transition-all duration-300 ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-2xl z-50 border-wedding-gold/50 bg-white/95' : 'bg-white/70'}`}
                                                                >
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="flex -space-x-4">
                                                                            <img
                                                                                src={boy.imageUrl}
                                                                                alt={boy.firstName}
                                                                                className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md bg-wedding-navy/5 ring-2 ring-wedding-navy/5"
                                                                                title={boy.firstName}
                                                                            />
                                                                            <img
                                                                                src={girl.imageUrl}
                                                                                alt={girl.firstName}
                                                                                className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-md bg-wedding-gold/5 ring-2 ring-wedding-gold/5"
                                                                                title={girl.firstName}
                                                                            />
                                                                        </div>

                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            {match.status !== MatchStatus.ARCHIVED ? (
                                                                                <button
                                                                                    onClick={() => onUpdateStatus(match.id, MatchStatus.ARCHIVED)}
                                                                                    className="text-wedding-navy/20 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                                                                    title="Archiver"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => onUpdateStatus(match.id, MatchStatus.RESEARCHING)}
                                                                                    className="text-wedding-navy/20 hover:text-green-600 transition-colors p-1.5 hover:bg-green-50 rounded-lg"
                                                                                    title="Restaurer"
                                                                                >
                                                                                    <RefreshCcw className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-lg font-serif font-bold text-wedding-navy mb-1 group-hover:text-wedding-gold transition-colors">
                                                                        {boy.firstName} & {girl.firstName}
                                                                    </div>
                                                                    <div className="text-[10px] text-wedding-text/60 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                        <span className="w-1 h-1 bg-wedding-gold rounded-full" />
                                                                        {boy.lastName} et {girl.lastName}
                                                                    </div>

                                                                    <div className="flex items-center justify-between pt-4 border-t border-wedding-navy/5">
                                                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-wedding-text/40 uppercase tracking-widest">
                                                                            <Clock className="w-3 h-3 text-wedding-gold" />
                                                                            <span>{new Date(match.lastUpdated).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button className="p-2 bg-wedding-navy/5 text-wedding-navy hover:bg-wedding-navy hover:text-white rounded-xl transition-all duration-300">
                                                                                <MessageCircle className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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
