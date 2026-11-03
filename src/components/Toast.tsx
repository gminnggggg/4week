import { Icon } from './Icon';

type Props = { visible: boolean; msg: string; icon: string };

export function Toast({ visible, msg, icon }: Props) {
  return (
    <div
      className={`fixed bottom-toast left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-on-surface text-surface px-3 py-2 rounded-xl shadow-xl text-[11px] transition-all duration-300 max-w-[85%] whitespace-nowrap ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'
      }`}
    >
      <Icon name={icon} className="text-[15px] text-secondary-container" />
      <span className="font-medium truncate">{msg}</span>
    </div>
  );
}
