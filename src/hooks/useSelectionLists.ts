import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchableSelectOption } from '../components/common';
import {
  branchApi,
  extractListData,
  fetchAllPages,
  supplierApi,
  type FilialDto,
  type FornecedorDto,
} from '../services';
import { usePermissions } from './usePermissions';

/** Todas as filiais (cerca de 200), para escolher com busca local. */
export const useBranches = (enabled = true) => {
  const [branches, setBranches] = useState<FilialDto[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchAllPages<FilialDto>((page) => branchApi.list({ page, limit: 100 }), 5)
      .then((list) => {
        if (active) setBranches(list);
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return branches;
};

/** Opção de filial que também acha pelo código, CNPJ e cidade. */
export const branchSearchText = (branch: FilialDto) =>
  [branch.id, branch.cnpj, branch.endereco?.cidade].filter(Boolean).join(' ');

export const supplierToOption = (supplier: FornecedorDto): SearchableSelectOption => ({
  value: String(supplier.id),
  label: `${supplier.nome}${supplier.cnpjCpf ? ` (${supplier.cnpjCpf})` : ''}`,
  searchText: String(supplier.id),
});

/**
 * Fornecedores para um select. O admin master enxerga mais de 40 mil, então
 * busca no servidor pelo que digitar (nome, ou CNPJ/CPF se digitar só
 * números). Os demais perfis só veem os fornecedores da filial, carregados de
 * uma vez e filtrados na tela.
 */
export const useSupplierSearch = (enabled = true) => {
  const { isAdminMaster } = usePermissions();
  const [suppliers, setSuppliers] = useState<FornecedorDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastRequest = useRef(0);

  useEffect(() => {
    if (!enabled || isAdminMaster) return;
    let active = true;
    fetchAllPages<FornecedorDto>((page) => supplierApi.list({ page, limit: 100 }))
      .then((list) => {
        if (active) setSuppliers(list);
      })
      .catch(() => {
        if (active) setSuppliers([]);
      });
    return () => {
      active = false;
    };
  }, [enabled, isAdminMaster]);

  const findSuppliers = useCallback(async (term: string): Promise<FornecedorDto[]> => {
    const digits = term.replace(/\D/g, '');
    const byDocument = digits.length >= 3 && !/[a-zà-ú]/i.test(term);
    const res = await supplierApi.listAdmin(byDocument ? { cnpjCpf: digits, limit: 50 } : { nome: term, limit: 50 });
    return extractListData<FornecedorDto>(res);
  }, []);

  const search = useCallback(
    (term: string) => {
      const request = ++lastRequest.current;
      setIsLoading(true);
      findSuppliers(term)
        .then((list) => {
          if (request === lastRequest.current) setSuppliers(list);
        })
        .catch(() => {
          if (request === lastRequest.current) setSuppliers([]);
        })
        .finally(() => {
          if (request === lastRequest.current) setIsLoading(false);
        });
    },
    [findSuppliers]
  );

  return {
    suppliers,
    setSuppliers,
    isLoading,
    /** Só o admin master busca no servidor; os outros filtram a lista local. */
    search: isAdminMaster ? search : undefined,
    findSuppliers,
    isRemote: isAdminMaster,
  };
};
