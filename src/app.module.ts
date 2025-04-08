import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { SupabaseService } from './services/supabase.service';
import supabaseConfig from './config/supabase.config';
import { HealthController } from './controllers/health.controller';
import { PokemonController } from './controllers/pokemon.controller';
import { PokemonService } from './services/pokemon.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [supabaseConfig],
    }),
  ],
  controllers: [
    AuthController,
    HealthController,
    PokemonController
  ],
  providers: [
    {
      provide: SupabaseService,
      useClass: SupabaseService,
    },
    {
      provide: PokemonService,
      useClass: PokemonService,
    }
  ],
})
export class AppModule {}
