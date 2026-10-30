import {
  isUniversalLight,
  nucleotideTranslations,
  preferredTranslation,
  type NucleotideTranslation,
} from '../model/sequences';
import type { Chain } from '../model/types';

export function PreferredSequences({
  chains,
  registered,
  picks,
  onPick,
}: {
  chains: Chain[];
  registered: Record<string, number>;
  picks: Record<string, string>;
  onPick: (chainId: string, translationId: string) => void;
}) {
  if (!chains.length) return null;

  return (
    <section className="ratio-plan" aria-label="Preferred sequences">
      <h3>Preferred sequences</h3>
      <p className="sm">
        The chain is fixed by the well. When that chain has been registered before, choose the nucleotide
        translation whose performance you want. A universal light chain can have more than one.
      </p>
      {chains.map((chain) => {
        const translations = nucleotideTranslations(chain, registered[chain.id] ?? 0);
        const preferred = preferredTranslation(translations);
        const selected =
          translations.find((item) => item.id === picks[chain.id])?.id ?? preferred?.id ?? '';
        return (
          <div className="seq-chain" key={chain.id}>
            <h4>
              {chain.name}
              {isUniversalLight(chain) ? <span className="pref-tag">Universal light chain</span> : null}
            </h4>
            {translations.length ? (
              <div className="seq-options" role="group" aria-label={`Nucleotide translation for ${chain.name}`}>
                {translations.map((item) => (
                  <SequenceOption
                    key={item.id}
                    item={item}
                    pressed={item.id === selected}
                    onPick={() => onPick(chain.id, item.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="sm">Not registered yet, so there is no preferred translation.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}

function SequenceOption({
  item,
  pressed,
  onPick,
}: {
  item: NucleotideTranslation;
  pressed: boolean;
  onPick: () => void;
}) {
  return (
    <button type="button" className="seq-option" aria-pressed={pressed} onClick={onPick}>
      <span className="seq-top">
        <span className="nm">{item.name}</span>
        {item.preferred ? <span className="pref-tag">Preferred</span> : null}
        <span className="sm">
          Characterized on {item.molecules} molecule{item.molecules === 1 ? '' : 's'}
        </span>
      </span>
      <span className="sm">{item.contribution}</span>
      <span className="sm">{item.basis}</span>
    </button>
  );
}
