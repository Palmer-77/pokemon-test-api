import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreatePokemonDto } from '../dto/create-pokemon.dto';
import { UpdatePokemonDto } from '../dto/update-pokemon.dto';
import { Pokemon } from '../interfaces/pokemon.interface';

@Injectable()
export class PokemonService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = new SupabaseClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    const { data, error } = await this.supabase
      .from('pokemons')
      .insert([createPokemonDto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(): Promise<Pokemon[]> {
    const { data, error } = await this.supabase
      .from('pokemons')
      .select('*');

    if (error) throw error;
    return data;
  }

  async findOne(id: number): Promise<Pokemon> {
    const { data, error } = await this.supabase
      .from('pokemons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, updatePokemonDto: UpdatePokemonDto): Promise<Pokemon> {
    const { data, error } = await this.supabase
      .from('pokemons')
      .update(updatePokemonDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: number): Promise<Pokemon> {
    const { data, error } = await this.supabase
      .from('pokemons')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 